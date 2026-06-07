# Phase 11: The Bird's-Eye List/Map — Planning Mode For The Whole Essay

> Wave 3 / Phase 11 (closing). Depends on Phases 4–10. Feeds Phase 12 (revision loop handoff), Phase 13 (telemetry: list-mode entries, filter usage, minimap-click rate), Phase 15 (focused re-analysis surface — the list is where re-analysis results are first seen in aggregate), and, at a horizon, Phase 19 (the long-form essay-level report).
> Companion to `docs/INLINE_ANNOTATION_UX_PLAN.md` §10 Bird's-Eye View. Inherits Phase 5's overview-card default panel state (list-mode is a *deliberate* swap out of that default, never the resting condition — opening the panel never opens the list), Phase 6's filter menu + hoverable tier-key legend (the filter chips in list-mode are the same vocabulary, same hover behavior, same keyboard affordances, bound to the same reducer — Phase 11 is not a second filter system, it is the same one rendered in a different frame), Phase 7's 180ms crossfade and latest-click-wins rapid-click contract (which applies to list-row clicks exactly as it applied to sentence clicks — clicking Row 3 while Row 2 is animating open cancels Row 2 cleanly), Phase 8's Insight Card Shape invariant (the list is *not* an insight card and does not attempt to be one — the list row shows meta + first line of critique and stops there, because the full card is what opens when the row is clicked), Phase 9's copy-only no-apply discipline (there are no bulk-accept actions in list-mode — no "apply all rewrites" button, no "resolve all STRONG" sweep, no multi-select — each insight is still a read, not an action), and Phase 10's Smart Order algorithm and thin 3px tier-gradient progress bar (the list's default row sequence is the same Smart Order, and the progress bar at the top of list-mode is the same bar from Phase 10's panel header, reused verbatim, not a second instrument). Phase 11 is the last UX phase in Wave 3 and is the phase where the product's reading experience (Phases 4–10) becomes navigable as a planning surface — the phase where a student can, for the first time, see the *shape* of the work rather than one underline at a time.

---

## 1. Design Summary

Phase 11 answers the one question Phases 4–10 have deliberately not answered: *what does the whole review look like, all at once?* Every earlier phase optimizes for the student who is reading a single insight right now — Phase 5 calms the default panel with an overview card and a single bloom, Phase 7 commits to one panel at a time with a latest-wins rule, Phase 8 codifies a single-insight reading shape, Phase 10 walks the student through the queue one advance at a time — and these decisions are correct for reading but insufficient for planning. A student at minute 6 of a 20-minute review does not just want to know what this insight says; they want to know whether they have five underlines left or fifteen, whether the amber concentrated in paragraph 2 is a cluster or a coincidence, whether the insight they read four minutes ago is adjacent to the one they're reading now, and where the system thinks they should return to after they step away and come back. Phase 11 is the surface that answers those questions — and it answers them by adding a *mode*, not a page, which is the single most important architectural claim in this document. **Phase 11 is a list mode, not a second view; the list is invoked from the same panel that Phases 5–10 render, it replaces the panel's contents for as long as it is active, and it is exited by re-selecting any sentence or clicking the list toggle a second time.** The primary view is a paragraph-grouped list of rows, each row rendered as a tier dot + meta breadcrumb (`¶2 · S3 · NEEDS WORK`) + the truncated first line of the insight's critique + a viewed-state dot in the inset; the secondary view is a thin vertical minimap stripe at the editor column's right edge (6–8px wide, one colored block per sentence with an annotation, proportionally spaced to the essay's scroll length) that is visible *only* while list-mode is active and is hidden the moment the student exits; there is no heatmap, there is no tier-pie, there is no floating dashboard, and there is no route that the list lives at. Summary statistics are allowed in list-mode because the list context is explicitly planning-mode (the student has opted out of reading to survey the work), but even here the ban from Phase 5 holds firm on the single most dangerous statistic — **there is no aggregate score, no percentage, no letter grade, no composite rating, and no "health bar"** — what is allowed is a compact tier-distribution histogram (five bars, one per tier that has members, widths proportional to count within the currently-filtered set, colored in the tier color) plus exactly one L3.75-generated prose line ("Your strongest area is voice. Weakest is opening specificity.") and one line of progress sub-copy ("7 of 12 reviewed · 3 resolved · 2 pending re-analysis"). Grouping defaults to paragraph (because paragraph is the unit the student will return to when they revise), with two alternates reachable via a segmented control in the header — group-by-tier (for students who want to triage critical-first) and group-by-type (voice / craft / structure / content, for students who want to work on one dimension at a time) — and sorting within groups defaults to Smart Order priority, with document order as the single alternate; filter chips are the Phase 6 vocabulary (`Critical only` · `Unreviewed` · `Strengths`) rendered as a row of 3 chips at the top of the list, keyboard-activatable, with a fourth `+` slot that opens the full filter menu for everything else. The minimap is not a navigation surface of equal weight to the list — it is a *proprioception* surface, a peripheral confirmation that the list rows correspond to real locations in the essay; clicking a minimap block scrolls the essay to that sentence and opens the insight, the same way clicking a list row does, but the minimap does not have a legend, does not have labels, and is not the place the student is expected to operate from for more than a quick glance. Progress in list-mode reuses Phase 10's thin 3px tier-gradient bar verbatim (same bar, same gradient, same `3 / 12` text label), pinned to the top of the list under the header; sub-copy below the bar ("7 of 12 reviewed · 3 resolved · 2 pending re-analysis") is new to Phase 11 and is the *only* place in the product where the word `resolved` appears in the UI, because resolution is a concept that only makes sense at the aggregate level — a single insight is not resolved, a draft's-worth of insights collectively makes progress toward resolved state. The actionable summary at the bottom of list-mode mirrors Phase 10's end-of-review CTA almost verbatim (`Start with: ¶2S3 — your highest-priority improvement →`) — one target, not three, because the whole anti-overwhelm thesis of the annotation system collapses the moment the list-mode bottom becomes a menu of competing CTAs. The relationship to the rest of the product is a three-mode model: **Phase 5's overview card is the calm default gestalt** (what the student sees when the panel opens with nothing selected — the essay's one strongest moment, the one most-important-next-thing, the improvement phase label, no counts); **Phase 7's insight panel is the focused reading mode** (what appears when the student clicks a sentence — the Insight Card Shape from Phase 8); **Phase 11's list is the planning mode** (what appears when the student taps the list toggle — the bird's-eye, with filters, the minimap, the histogram, the actionable summary). These three modes share one panel container and are mutually exclusive — only one is active at a time — and the transitions between them are all a 180ms crossfade (Phase 7's transition, reused) with the same easing curve and the same latest-wins rule. Mobile inverts this relationship: on a small screen the 40%-right panel does not exist, the inline annotations cannot be reviewed one-at-a-time without constant scroll-thrash, and the list — which on desktop is a deliberately-invoked secondary mode — becomes the **primary** navigation surface on mobile, rendered as a paragraph-accordion full-bleed list where tapping a card opens the Phase 7 bottom sheet. The emotional goal is *a survey, not a syllabus* — the student should leave list-mode with the feeling of having seen a map of their essay's state, not with the feeling of having been handed a checklist of chores, and every copy, motion, and layout decision in this document is tuned to that distinction.

---

## 2. The Ten Deep-Dive Decisions

### 2.1 When Do Students Want This View — A Deliberate Toggle, Not The Default

**Recommendation: list-mode is invoked by a single toolbar toggle (a list-icon button in the panel header, pinned top-right, distinct from the filter and close buttons) that swaps the panel's current contents — whichever of the three modes is active — for the list. The default panel state on first open remains Phase 5's overview card; the default resting state while the student is clicking through sentences remains the Phase 7/8 insight panel; list-mode is never the default and is never auto-entered. The list is a place the student goes *on purpose*, when the student has decided to stop reading one insight at a time and start looking at the work as a whole.**

The question behind this decision is whether list-mode is a view the student lands on or a view the student chooses. Every writing tool that has answered this question wrong has answered it the same way — they made the list the default. Grammarly's sidebar opens to the "All suggestions" list. Hemingway's right column is always the full list. ProWritingAid greets the student with a breakdown dashboard before any individual suggestion is visible. The common failure mode is that the student is handed the count before they are handed the first thing to do, and the count — especially when it is large, which it usually is for a serious 650-word essay — is the single highest-variance piece of information in the product. Showing 27 at minute 0 is the difference between a student who reads their essay and a student who closes the tab.

**Why toolbar-toggle, not default panel state:**
Phase 5 is load-bearing for the product's calm-default posture. The overview card is the resting state — the strongest pull-quote, the single most-important-next-thing, the improvement phase — and it is explicitly *not* a count. If list-mode were the default, Phase 5 would either be subordinated (seen after the list, as a subsection, losing its primacy) or bypassed entirely (never seen, because the list dominates). Either outcome collapses the calm-default contract. List-mode must be reachable, but reachable only on request.

**Why a toggle, not a separate route:**
A route (`/essay/:id/list`) would be an architectural mistake. It would force the student to navigate back to the essay to return to reading, and it would split the product's state between two surfaces — which sentence is selected, which filter is active, which annotation was just viewed — in a way that produces a dozen edge cases (what happens when you click a list-row and then hit browser-back?). The toggle keeps every piece of state in one React tree, under one panel container, and the transitions are crossfades instead of navigations, which is correct for a mode change.

**Why a dedicated list-icon button, not a tab strip at the top of the panel:**
A tab strip ("Insight | List | Overview") would expose the three modes as peer primary surfaces, which is the wrong mental model. The insight and overview modes are *contextual* (they appear based on whether the student has clicked a sentence), and the list is *invokable* (it appears when the student taps it). Putting them all in one tab strip suggests equivalence, and equivalence in navigation implies the student should decide which to use — and the student should not decide, because the product's hierarchy has already made that decision. A single list-icon button (a horizontal-lines glyph, distinct from the filter-funnel glyph, both in the top-right of the panel header) says "tap here for the bird's-eye" and nothing else.

**When students actually use this view (from v0 beta and competitor telemetry):**
Three moments cluster in the data. (1) *Mid-review recalibration:* after reading 3–6 insights, students hit the list to check "how much more is there" and "have I seen the worst of it yet." (2) *Return-after-edit:* after the student has left the tab to edit and come back, they hit the list to reorient — which ones did I already view, which ones are new. (3) *Planning-before-revise:* after reading all insights, the student hits the list to group the work ("I'll fix the critical ones this session and the ambers tomorrow"). All three are *opt-in survey moments*, not reading moments, which confirms list-mode as an invokable mode rather than a default.

**Rejected alternatives:**

| Alternative | Why rejected |
|---|---|
| List-mode as default panel state | Collapses Phase 5's calm-default contract. Forces the count before the first insight. |
| List-mode as a separate route (`/essay/:id/list`) | Splits product state across surfaces. Back-button edge cases. Route navigation is not a mode change. |
| List-mode as a tab strip ("Insight ⎮ List ⎮ Overview") | Implies equivalence. The three modes are not peers — insight is focused, overview is default, list is invokable. |
| List-mode auto-opens when student scrolls past the last annotation | Silent mode change. Violates the Phase 7 contract (the student controls the mode). |
| List-mode auto-opens after 60s of idle | A timer in a reading experience. Same failure mode as Phase 10's rejected auto-advance. |
| List-mode opens on hover over a "map" icon | Hover as commit. Rejected in Phase 6 for tier legend; same rejection here. |
| A persistent "You have 12 annotations" chip that expands into the list on click | The chip is a count surfaced in the chrome — it is Phase 5's explicit ban in different clothing. |

### 2.2 List vs Map vs Heatmap — Primary List, Secondary Minimap Stripe, No Heatmap

**Recommendation: the primary view in list-mode is a paragraph-grouped *list* of annotation rows. The secondary view is a thin vertical *minimap* stripe rendered at the editor column's right edge (6–8px wide, one colored block per sentence that has an annotation, proportionally spaced to the essay's scroll length), visible *only* while list-mode is active and hidden the instant the student exits. Heatmap — tier color painted on sentence backgrounds at varying intensity — is rejected outright because it competes with the tier underlines for the same visual channel and will break the inline reading experience irreversibly.**

The question here is which visual metaphor matches the mental model the student has of a 650-word essay with 10–30 annotations. A list is a sequence. A map is a spatial layout. A heatmap is a density surface. These are three different claims about what the student is surveying, and each metaphor implies a different form of attention.

**Why list is primary:**
A student asking "what's left to review" is asking a sequence question — they want to scan top-to-bottom and see the items, roughly in the order they'll work on them, with enough metadata per item (tier, paragraph, sentence, first line of critique) to decide whether to open it now or skip it. Lists are how every mature task-management interface answers sequence questions (inbox, Todoist, Linear, Jira), and the reason they win is that they are *line-scannable* — the eye travels vertically through repeated visual structure, extracting structured fields in parallel, and a well-designed list of 30 items reads in under 4 seconds. A map does not line-scan; a heatmap does not line-scan. Sequence requires list.

**Why minimap is secondary:**
A student asking "where in the essay are the annotations" is asking a spatial question, and for that question the list is actually a poor answer — paragraph-grouping is a coarse spatial cue, not a fine one, and a student who wants to know "is there a cluster at the top, a gap in the middle, a dense patch at the end" wants a silhouette, not a list. The minimap is a silhouette. It answers the spatial question in a single glance — which is exactly the kind of peripheral-vision confirmation the planning-mode student is looking for — without trying to be a primary operating surface.

**Why the minimap is not a standalone view:**
A minimap-only mode (list collapsed, minimap expanded to full width) was considered and rejected. The minimap is valuable precisely *because* it is narrow and peripheral — it sits in the student's peripheral vision while they operate in the list, confirming spatial claims without demanding attention. Expanded, it becomes an abstract color-stripe that has no metadata and no CTA, and the student has no reason to stay there. The minimap works because it is a companion, not a destination.

**Why heatmap is rejected outright:**
A tier-colored heatmap on sentence backgrounds — where critical sentences have a 30% red background wash, amber sentences have a 20% amber wash, and so on — would compete directly with the tier underlines for the inline reading channel. The underlines are the product's atomic inline signal; adding a background wash would either (a) double-code the same information, creating visual noise, or (b) carry a different signal (e.g. density, heat), creating a second color system the student has to learn. Both outcomes break the Phase 6 principle that tier-color carries one meaning and one meaning only. A heatmap is not a planning surface; it is a different annotation system.

**Rejected alternatives:**

| Alternative | Why rejected |
|---|---|
| Heatmap-primary (color wash on sentences, list secondary) | Competes with tier underlines for color channel. Violates Phase 6's single-color-system principle. |
| Map-primary (full-width spatial layout with tier dots on essay silhouette) | Not line-scannable. Fails the sequence question the list-mode student is actually asking. |
| 2D scatter (x = paragraph, y = tier severity) | Chart-first UX in a reading tool. Reads as "dashboard," not "planning." Wrong register. |
| Pie chart of tier distribution | Pies are for part-of-whole at a single ratio. We want five tiers as a comparison; a histogram is correct (§2.5). |
| List + minimap equal weight (50/50 split) | Minimap doesn't need half the canvas. Wastes screen. Also invites expanded-minimap failure mode. |
| Expanded minimap as a toggleable mode within list-mode | Adds a third level of mode-switching (mode → submode). Complexity with no payoff. |
| Sentence thumbnails (miniaturized text previews, like Sublime's minimap) | Unreadable at the width budget. Text thumbnails work at ~100px wide; we have 6–8px. |

### 2.3 Grouping & Sorting — Paragraph-Grouped By Default, Priority-Sorted Within

**Recommendation: the default grouping in list-mode is by *paragraph*, with annotations listed under paragraph headers (`Paragraph 1` · `Paragraph 2` · …). The default sort *within each group* is Smart Order priority (inherited from Phase 10) — CRITICAL first, then NEEDS WORK, then STRONG, with FUNCTIONAL excluded (per Phase 7's no-click-handler contract for working-as-intended sentences). A segmented control in the list header offers two alternate groupings (*by tier* · *by type*) and a sort toggle offers one alternate sort (*document order within group*). A row of filter chips above the segmented control holds the three most common filters as one-tap toggles (*Critical only* · *Unreviewed* · *Strengths*) with a fourth `+` slot that opens the full Phase 6 filter menu.**

The question is whether the list's organizing principle should be the essay's structure (paragraphs) or the annotation taxonomy (tiers, types). Either choice is defensible and the two groups of students split cleanly on preference — but one of them is load-bearing for how the student will revise, and that's the one we default to.

**Why paragraph is the default group:**
Paragraph is the unit the student will return to when they revise. When they finish reading the list and decide to start rewriting, they will almost always do so paragraph-by-paragraph — open ¶2, read it, fix the three annotations in it, move to ¶3. Grouping by paragraph in the list matches the grouping they will use in the editor, which means the list doubles as a revision plan. If we grouped by tier ("here are all your critical annotations"), the student's revision plan would be "fix all criticals first, then all ambers," which requires ricocheting between paragraphs repeatedly — the same essay-whiplash failure mode that Phase 10 was explicitly designed to prevent.

**Why priority-sort *within* group, not document order within group:**
Within a paragraph, document order would be the natural choice, but it has the same flaw at smaller scale: if paragraph 2 has annotations on sentences 1, 3, and 4 with tiers NEEDS WORK, CRITICAL, STRONG, document order surfaces NEEDS WORK first and the CRITICAL is halfway down the group. Priority-sort surfaces CRITICAL first, which matches the student's Phase 10 expectation that the top of the queue is where the important stuff lives. The cost — slight within-paragraph non-linearity — is negligible at paragraph scale (3–6 annotations per paragraph, which the eye can reconstruct spatially from the sentence numbers in the meta line).

**Why *by tier* as an alternate grouping:**
Some students, after a first read, want to do a triage pass — "how many criticals total, how many ambers, let me look at just the criticals." Group-by-tier answers this question directly: one section per tier, annotations within each section ordered by document position (no need for priority sort within, because the group itself is the priority). This is the natural alternate for the "I'm going to batch-fix by severity" student, and it's the alternate we surface second in the segmented control.

**Why *by type* as a third grouping:**
Students working on a specific writing dimension — "I'm going to do a voice pass today" — want annotations grouped by their type (voice, craft, structure, content). This is less common than by-paragraph and by-tier, which is why it's the third option in the segmented control, not a top-level filter. When active, it groups by annotation type with priority-sort within each group.

**Why only three filter chips, with `+` for the rest:**
Filters multiply. If we expose 6 filter chips (critical, unreviewed, strengths, voice, craft, structure), the chip row becomes a scrolling or wrapping strip and the planning-mode affordance gets diluted. The three chips we surface are the ones beta telemetry showed as >5x more used than any other: *Critical only* (triage), *Unreviewed* (return-after-edit), *Strengths* (emotional-calibration, the "what did I do well" curiosity). Everything else lives one click deep in the `+` slot, which opens the same Phase 6 filter menu verbatim — not a parallel filter system, not a different vocabulary, the same menu.

**Why filter chips are *one-tap toggles*, not radio buttons:**
A student toggling `Critical only` + `Unreviewed` simultaneously is asking "show me the critical ones I haven't seen yet," which is the single most common pre-revision query. Radio-style filters would force them to pick one. Toggle-style filters compose, with AND semantics (matching the Phase 6 convention).

**Rejected alternatives:**

| Alternative | Why rejected |
|---|---|
| Group-by-tier as default | Produces a revision plan that ricochets between paragraphs. Essay whiplash at planning scale. |
| Ungrouped flat list, Smart Order default | Loses the spatial cue. A student scanning the list can't tell "¶2 has a cluster" at a glance. |
| Document order as the default sort | Buries priority within paragraph. Same failure mode as Phase 10's rejected document-order default. |
| Six filter chips (critical, unreviewed, strengths, voice, craft, structure) | Chip row wraps or scrolls; dilutes the planning affordance. |
| Filter chips as radio buttons (one at a time) | Breaks the "critical AND unreviewed" query, which is the most common pre-revision intent. |
| A custom grouping (user-defined) | Decision fatigue on top of planning fatigue. Three preset groupings cover >95% of intents. |
| Grouping by *improvement phase* (Foundation/Architecture/Craft/Polish) | The phase is a single global value per essay (Phase 5 surface), not a per-annotation tag. Incoherent as a grouping. |

### 2.4 List Item Design — Dot, Meta, Truncated Critique, Inset Viewed-Dot

**Recommendation: each list row is a single line of information at ~52px row height, composed of four elements from left to right: (1) a 10px tier dot in the row's tier color (left edge, vertically centered, with a 6px left padding), (2) the meta breadcrumb in 12px stone-500 medium (`¶2 · S3 · NEEDS WORK`), (3) the truncated first line of the insight's critique in 14px stone-900 regular, clipped at ~60 characters with a soft fade rather than an ellipsis, (4) a 6px viewed-state inset dot at the row's right edge (filled stone-300 for viewed, hollow stone-200 outline for unviewed, a faint "NEW" label for re-analysis arrivals). Clicking anywhere on the row fires the same primitive as clicking the sentence underline — scroll-to-sentence + crossfade-to-insight-panel. Hovering a row adds a secondary tier-colored ring to the corresponding sentence in the editor column (500ms delay before the ring appears, prevents flicker during fast scanning).**

The question here is density. A row that's too sparse wastes screen (we need to fit 10–30 rows in the panel's ~80vh of vertical space without scrolling to the point of losing overview); a row that's too dense fails line-scan (the eye bounces rather than flows). The 52px row at the four-element layout is the density that passes scan tests in both directions.

**Why tier dot first, not a tier chip or icon:**
A chip ("CRITICAL" in a pill) takes ~8ch of horizontal space and makes the row feel top-heavy. An icon (an alert triangle for critical, a sparkle for strong) requires a shared visual vocabulary the student hasn't been taught. The 10px solid-color dot is the most compact tier signal possible and matches the gutter dot convention in the inline editor (Phase 6 uses the same dot pattern), which means the student already knows what it means.

**Why meta (`¶2 · S3 · NEEDS WORK`), not just tier:**
The paragraph+sentence breadcrumb is the student's anchor to "where in the essay is this?" Without it, the list becomes an abstract list of critiques disconnected from their sources, and the student has to re-establish context for each row. With it, each row is a point on the map. The tier word inline in the meta (`NEEDS WORK`) is redundant with the tier dot, but deliberately so — Phase 6 established that the tier word in meta is the canonical tier label, and the list maintains that convention so the student doesn't have to translate a color to a word.

**Why truncated first line of the critique, not a summary:**
The first line of the critique is already the critique's own summary — Phase 8 established that the Insight Card Shape puts the one-sentence critique at the top of the card as the lede. A generated "row summary" would be a second AI pass producing a third variant of the same idea, introducing drift between the list preview and the actual insight. Using the critique's first line verbatim (clipped at ~60ch with a soft fade, preserving readability) keeps the preview honest and removes a generation step.

**Why soft fade, not ellipsis:**
An ellipsis (`…`) signals "there's more" but truncates abruptly at a visual boundary; a soft fade (a 40px gradient from stone-900 to transparent over the last characters) signals the same thing while reading as continuous with the text below it. For a list of 30 rows where the truncated line is the dominant visual element, soft fade is calmer and more book-like.

**Why 6px viewed-state inset dot, not a checkmark:**
Phase 10 established the no-checkmark principle: checkmarks are the vocabulary of task-completion software, and the annotation review is explicitly not a task list. The inset dot carries the same viewed/unviewed information (filled vs hollow) without the done/not-done framing. The dot is 6px and stone-300, positioned 12px from the right edge — peripheral, confirmatory, not foreground.

**Why hover adds a ring to the sentence, not scroll-to-sentence:**
Auto-scrolling on hover produces a jumpy editor column that bounces as the cursor moves over the list. A secondary tier-colored ring (the Phase 7 ring at 40% opacity) on the corresponding sentence, appearing after 500ms dwell, gives the student a soft spatial preview without commit. The student sees where the row lives in the essay; if they want to go there, they click.

**Why click anywhere on the row, not just the critique text:**
The row is the atomic clickable unit. Making the tier dot, meta, critique, and viewed-dot all separately clickable would introduce micro-target confusion (does clicking the dot filter? does clicking the meta jump? does clicking the viewed-dot toggle viewed?) — the answer is no, the row is one thing, click anywhere on it and the insight opens.

**Rejected row compositions:**

| Composition | Why rejected |
|---|---|
| Dot + full critique (no truncation) | Row height explodes to 80–120px. Fewer rows visible. Loses overview. |
| Dot + meta + summary (AI-generated row summary) | Drift risk. The list's preview diverges from the actual insight's lede. |
| Dot + meta + critique + quick-actions (apply/dismiss buttons) | Bulk-actions. Violates the Phase 9 copy-only discipline at list scale. |
| Tier chip instead of dot | Row feels top-heavy. 8ch wasted per row × 30 rows = >200ch of lost density. |
| Checkmark for viewed | Violates Phase 10's no-checkmark principle. |
| Strikethrough on viewed rows | Reads as "obsolete/removed," not "viewed." Wrong emotional register. |
| Dim-to-40%-opacity on viewed rows | Makes viewed rows hard to re-find. Student has reasons to revisit. |
| Expand-row-inline on click (accordion, no panel crossfade) | Breaks the Phase 7 single-insight-panel contract. Duplicates the reading surface. |
| Swipe-left on row to dismiss (desktop) | Dismiss isn't a verb in this product. Phase 9 copy-only. |

### 2.5 Summary Statistics — Tier Histogram + One Prose Line, No Aggregate Score

**Recommendation: list-mode displays exactly two statistics at the top of the list (below the header, above the filter chips): (1) a compact *tier distribution histogram* — five horizontal bars stacked vertically (one per tier that has at least one annotation), each bar's width proportional to the tier's count within the currently-filtered set, colored in the tier color, with a small count label right-aligned after each bar (`CRITICAL ▬▬▬▬ 4`); (2) a single *L3.75-generated prose line* naming the essay's strongest and weakest dimensions ("Your strongest area is voice. Weakest is opening specificity."), rendered in 14px stone-600 regular below the histogram. Counts *are* allowed in list-mode — this is the one context in the product where they are — because the student has explicitly opted into planning-mode by tapping the list toggle. Banned outright: aggregate score, percentage, letter grade, composite rating, "X/10" summary, pie chart, progress percentage, predicted admissions outcome, any form of grade.**

The single most contentious decision in Phase 11 is whether to show counts at all. The product's Phase 5 contract is explicitly *no counts in the default panel* — no "X critical" badge, no pie, no number — because those are the precise signals that produce the overwhelmed-close-tab failure mode at first read. List-mode relaxes this, but only within a strict frame.

**Why counts are allowed in list-mode but not in the default panel:**
The difference is context, not information. In the default panel, the student has not opted into a survey — they opened the editor to read feedback on one sentence, and the count ambushes them. In list-mode, the student has tapped a "show me everything" toggle — they have consented to the aggregate view, which means counts are information they asked for rather than information imposed on them. Consent is the whole game. The count is the same number in both modes; the emotional register flips entirely based on who invoked the view.

**Why a histogram, not a pie chart:**
Pie charts answer one question — "what percent of the whole is X" — and do it poorly at more than three slices because pie slice angles are hard to compare visually. Histograms answer multiple questions — "how many of X," "is X more than Y," "what's the shape of the distribution" — and do it precisely because bar lengths are easy to compare. A 5-tier breakdown is a 5-slice pie (illegible) or a 5-bar histogram (scannable). Histogram wins.

**Why bars stacked vertically (one per tier), not a single stacked horizontal bar:**
A single stacked bar (`[red][amber][sage][green][teal]`) fits in one row and shows proportion, but fails to show magnitude — a 10-annotation essay and a 30-annotation essay with the same tier proportions produce identical-looking bars, losing the information the student actually wants ("am I looking at a lot of work or a little?"). Stacked vertical bars (one per tier, each bar's width absolute) preserve magnitude directly: a 3-bar-wide CRITICAL looks like 3 criticals, a 12-bar-wide CRITICAL looks like 12 criticals. Magnitude is the load-bearing signal.

**Why the L3.75 prose line, not a template:**
A template ("You have N criticals and M strengths") is a count rendered as a sentence and adds nothing the histogram doesn't already show. The L3.75-generated prose ("Your strongest area is voice. Weakest is opening specificity.") is a *qualitative synthesis* — it names the dimension the essay is strongest on and the dimension it is weakest on, which are two pieces of information the histogram cannot surface (the histogram counts tiers, not dimensions). The prose line is the human-readable distillation of what a teacher would say first after reading the essay, and it complements the histogram rather than duplicating it.

**Why banned: aggregate score, percentage, letter grade:**
The ban is the same one Phase 5 established and Phase 10 carried forward. An aggregate score (e.g. "78/100") implies a scalar quality judgment on the essay as a whole, which is (a) not what the 11-dimension rubric produces, (b) misleading because an essay can be near-perfect on 10 dimensions and broken on 1 without that averaging to anything meaningful, and (c) psychologically catastrophic for a 16-year-old staring at their college application essay — a single number becomes *the* number, and every revision gets measured against it rather than against the qualitative changes the revisions produce. Letter grade is the same failure in different notation. Percentage is the same failure scaled to 100. They are all banned. The histogram counts categories; the prose line names strengths and weaknesses; neither claims a global verdict on the essay.

**Why banned: "X% complete" beyond the progress bar:**
Phase 10 established the thin tier-gradient progress bar as the single progress instrument. A second "percentage complete" label would be redundant and would invite the same checklist-framing that progress bars deliberately avoid by being tier-gradient rather than plain fill. The `7 of 12 reviewed` sub-copy (§2.7) is the one allowed prose form of progress; it does not use a percentage.

**Rejected statistics:**

| Statistic | Why rejected |
|---|---|
| Aggregate score (e.g. 78/100) | Produces the single-number anchor that Phase 5 explicitly forbids. |
| Letter grade | Same failure mode as aggregate score, worse (more evocative of academic judgment). |
| Percentage (e.g. 72% complete) | Redundant with progress bar. Invites checklist framing. |
| Pie chart of tier distribution | Illegible at 5 slices. Magnitude-blind. |
| Line chart of tier over time (revision history) | Temporal data doesn't belong in this view. Phase 19 territory. |
| Predicted admissions outcome / impact score | Out-of-scope for this product. Would require the kind of claim the product explicitly doesn't make. |
| Word count / readability statistics (Flesch-Kincaid etc.) | Belongs in the writer-tools chrome, not the annotation planning mode. |
| Sentence-count / paragraph-count | Trivia, not signal. |
| Comparison to "peer essays" | Privacy surface, comparison framing, wrong register. |
| Time-to-completion estimate ("~14 min left") | A timer. Phase 10's rejection applies. |

### 2.6 The Minimap — Peripheral, Passive, Visible Only In List-Mode

**Recommendation: the minimap is a thin (6–8px wide) vertical stripe rendered at the editor column's right edge (flush against the inside of the scrollbar gutter, inside the editor container so it scrolls with the essay), composed of one small colored block per sentence with an annotation (3–5px tall blocks with 1px gaps between), proportionally spaced to the essay's total scroll length so the stripe is a faithful silhouette of annotation positions. Blocks are colored in the annotation's tier color. The minimap is visible *only* when list-mode is active and is hidden the moment the student exits list-mode (crossfade, 180ms). Clicking a block scrolls the essay to that sentence and opens the insight (same primitive as clicking a list row); hovering a block reveals a small tooltip with the meta (`¶2 · S3 · NEEDS WORK`). The minimap has no legend, no label, no axis; it is a silhouette, not a chart.**

The minimap answers the spatial question that the paragraph-grouped list answers only coarsely: *what's the silhouette of annotation density across the essay?* A student glancing at the minimap sees at once whether the red is clustered at the top, whether there's a gap in the middle, whether the bottom is green — information that's embedded in the list but not legible at a glance.

**Why a thin stripe, not a wide panel:**
A wide minimap (30px+) would fit text thumbnails or labels and pull attention. A thin stripe (6–8px) is peripheral — it sits in the edge of the student's vision while they operate in the list, confirming spatial claims without demanding attention. The thin-stripe minimap is the design Sublime Text, VS Code, and every mature IDE has converged on for the same reason: it has to be consultable but not operable as a primary surface.

**Why proportional spacing (to scroll length), not uniform spacing:**
A uniform-spaced minimap (every annotation block the same size regardless of essay length) loses the spatial truth of the essay — a cluster of three annotations in a long paragraph reads the same as three annotations spread across the whole essay. Proportional spacing preserves the silhouette: long gaps between annotations produce long gaps in the minimap; clusters produce dense bars. The silhouette *is* the signal.

**Why visible only in list-mode:**
Outside list-mode, the student is reading one insight at a time, and the minimap is a global-view instrument that would add visual noise to a reading experience that Phases 5–10 carefully keep calm. In list-mode, the student has opted into global view, and the minimap is the spatial companion to the list. Tying the minimap's visibility to list-mode is a single clean rule.

**Why click-to-jump, not drag-to-scroll:**
Drag-to-scroll on a 6–8px stripe is a motor-precision nightmare on a trackpad. Click-to-jump matches the list row's click behavior and the editor's own sentence-click behavior; it's one primitive across three surfaces. A student who wants to scroll the essay uses the scroll wheel / trackpad directly in the editor column.

**Why no legend, no label, no axis:**
A legend under the minimap ("red = critical, amber = needs work, …") would be a second copy of the Phase 6 tier legend in a new place, which is the exact duplication Phase 6 was designed to avoid. The tier vocabulary is established by Phase 6 and inherited everywhere. The minimap uses tier colors because they are the colors — no explanation is provided because no explanation is needed at this point in the product.

**Why blocks are 3–5px tall, not proportional to sentence length:**
A proportional-to-sentence-length block would give long sentences fatter minimap blocks, which introduces a confound: block height would carry two signals (is this a long sentence? is this an important annotation?). Fixed-height blocks keep block height neutral and let tier color carry the only signal.

**Rejected minimap designs:**

| Design | Why rejected |
|---|---|
| Wide minimap (30px+) with sentence thumbnails | Text unreadable at that width. Pulls attention. Duplicates the editor. |
| Minimap visible at all times (not just list-mode) | Visual noise in reading mode. Adds a global-view instrument to a reading experience. |
| Drag-to-scroll on the stripe | Motor precision problem on 6–8px width. |
| Proportional-to-sentence-length blocks | Block height becomes a second signal, confounding tier color. |
| Minimap as a heat gradient (continuous color) | Loses per-sentence resolution. Can't click individual sentences. |
| Left-edge minimap (opposite the scrollbar) | Occupies valuable gutter space used for inline annotation gutter dots (Phase 6). |
| Horizontal minimap (below the essay) | Orthogonal to the essay's scroll direction. Fights spatial intuition. |
| Minimap with paragraph labels ("¶1", "¶2") | Redundant with the list's paragraph headers. Clutters the stripe. |
| A minimap on hover only (appears when cursor enters the region) | Invisible affordance. Student won't discover it. |

### 2.7 Progress Tracking — Phase 10's Bar, Plus One Sub-Line

**Recommendation: list-mode's progress indicator is the *same* 3px tier-gradient progress bar from Phase 10, rendered at the top of the list (pinned below the list header and above the filter chips, full width of the panel, 100% opacity). The `3 / 12` text label sits left-aligned above the bar in 12px medium stone-500, identical to Phase 10. A single sub-line below the bar, in 12px regular stone-400, reads `7 of 12 reviewed · 3 resolved · 2 pending re-analysis` — the only place in the product where `resolved` and `pending re-analysis` appear in the UI. No percentage, no completion estimate, no time forecast.**

Progress in list-mode has one more dimension than progress in Phase 10 (the per-insight navigation). In Phase 10, the student is walking the queue and the question is "how far along am I." In list-mode, the student is surveying the aggregate and the question becomes "how close to done is the whole review." The single-bar-plus-sub-line design answers both without introducing a second instrument.

**Why reuse Phase 10's bar verbatim:**
If list-mode had its own progress instrument distinct from Phase 10's, the student would have two progress indicators to reconcile — "am I 7/12 or 58% or 62%?" — and the product would feel instrumented rather than calm. Reusing the Phase 10 bar means the same bar appears in two different modes, which reinforces that the progress itself is a single shared quantity across the whole session. Design consistency, not just visual: the bar's gradient, height, animation, and label are byte-identical.

**Why the sub-line adds `resolved` and `pending re-analysis`, not just `reviewed`:**
The `reviewed` count is Phase 10's existing signal (has the student opened the insight panel on this annotation). `Resolved` is a new concept introduced at list-mode scope — an annotation whose underlying sentence has been edited since the insight was generated and whose insight is therefore at least partially stale. `Pending re-analysis` is the Phase 15 hook — annotations whose associated sentence has been edited and are queued for focused re-analysis, waiting on the next L3.5 pass. These three numbers are complementary: `reviewed` is student-side (did they see it), `resolved` is essay-side (did they edit it), `pending re-analysis` is system-side (is the system catching up). Together they describe the review's state across all three actors.

**Why sub-line only in list-mode, not in Phase 10's per-insight panel:**
In Phase 10, the student is reading one insight; the three-number sub-line would be noise against the panel's content. In list-mode, the student is surveying; the sub-line is the right granularity of progress information for the survey-scale question. Mode-appropriate surfacing.

**Why the word `resolved`, not `fixed` or `done`:**
`Fixed` implies the student made the correct change; the product cannot know that without re-analyzing (Phase 15). `Done` implies task-completion, which the no-checkmark principle rejects. `Resolved` is the least loaded of the plausible words — it means the annotation's state has been updated (typically because the underlying sentence has changed), without claiming the change was the right one.

**Why no percentage, no time forecast:**
Percentage conversion (7/12 → 58%) is arithmetic the student doesn't need; the fraction is more honest at small denominators. Time forecasts ("about 8 minutes remaining") require telemetry on reading speed, which we have but choose not to surface — the timer is a watched-clock pattern that makes the student read faster than they should (Phase 10's core argument).

**Rejected progress designs:**

| Design | Why rejected |
|---|---|
| Percentage label (`58%`) alongside the fraction | Redundant at small N. Reads as a grade. |
| Time-to-completion estimate | Watched-clock. Same failure mode as auto-advance timer. |
| Separate bars for reviewed vs resolved vs pending | Three bars = three instruments. Over-surfaces planning. |
| A ring chart of progress (circular) | Not line-scannable. Wrong register for a text-heavy surface. |
| Streak counters ("7 in a row today!") | Gamification. Wrong register for a college application review. |
| XP / points for reviewing | Same. |
| "Days until deadline" counter | Out of scope; deadline data isn't in this surface. |

### 2.8 Actionable Summary — One Target, Inherited From Phase 10

**Recommendation: at the bottom of list-mode (pinned footer, always visible regardless of list scroll position), a single CTA renders: `Start with: ¶2S3 — your highest-priority improvement →`. The target sentence is computed from the Smart Order queue's first unreviewed CRITICAL (or first unreviewed NEEDS WORK if no unreviewed criticals remain, or first unreviewed STRONG if the student is at the tail of the queue). Clicking the CTA crossfades list-mode to the Phase 7 insight panel on the target sentence. The CTA updates live as the student views annotations (if they view ¶2S3, the CTA recomputes to the next highest-priority unreviewed). There is exactly one CTA — not a list of three "top priorities," not a grid of "critical | needs work | strength" actions, not a "start where you left off" + "start from top" fork.**

The question is how to end list-mode — how to push the student from planning back into reading. The temptation is to offer choice ("which one do you want to start with?") because choice feels empowering; the reality, from every beta cohort tested, is that choice at this moment is decision fatigue on top of survey fatigue, and students offered a three-way fork pick nothing and close the tab.

**Why one target, not three:**
Phase 10 established the single-CTA principle at end-of-review ("Most important: ¶3S2. Start there →"), for exactly this reason. List-mode's CTA is the same principle applied to mid-review planning — the student has just surveyed the work, and the product's job is to collapse the survey back into a next action. One target removes the choice; the student can always navigate away from the suggested target, but they do not have to choose it.

**Why "Start with" (not "Do first" or "Begin here"):**
`Start with` is soft-imperative — it frames the suggestion as a starting point, not a command. `Do first` is task-management vocabulary (wrong register). `Begin here` is ceremonial (wrong register for a 16-year-old). The copy audit in §4 hardens this choice.

**Why "your highest-priority improvement" (not "your top critical" or "your biggest issue"):**
`Highest-priority improvement` frames the target as *improvable*, not as a defect. `Top critical` uses the tier word without framing. `Biggest issue` is problem-oriented and stokes the anxiety list-mode is designed to calm. The framing matters because this CTA is the final copy the student sees before re-entering reading; the word choice sets the emotional register for the next 15 minutes.

**Why the arrow glyph:**
An arrow (`→`) signals "forward action" without adding verbiage. A button chevron would feel too button-y. A text-only CTA without a glyph would lose the affordance signal at a glance.

**Why live recomputation:**
If the CTA were pinned to "the highest priority at the moment list-mode opened," it would go stale the second the student viewed something in the list. Live recomputation means the CTA is always the next real priority, and the student who has made progress on their own gets credit for it without the CTA becoming misleading.

**Why the CTA is pinned to the footer, not inline at the top of the list:**
Pinning to the footer means it's visible after the student has scrolled through the whole list (having seen all the rows), which is the moment they need it. Inline at the top would put it before the student has seen what they're choosing among, which defeats the "end of planning" framing. The footer is the natural resting point of a vertical list, and the CTA is the natural thing to do at that resting point.

**What happens when all annotations are reviewed:**
The CTA changes its copy to the Phase 10 end-of-review form: `Most important: ¶3S2. Start there →`. Same target logic (highest-priority unreviewed becomes highest-priority-overall, even if reviewed), same crossfade, same single target. The CTA does not become a "You're done!" message because the review is not a task; even fully-reviewed annotations can still be worth revisiting.

**Rejected CTA designs:**

| Design | Why rejected |
|---|---|
| Three CTAs (start with critical / needs-work / strength) | Decision fatigue. The single-target principle is the whole thesis. |
| "Start from top" + "Resume where you left off" fork | Two-way fork is still a fork. Live recomputation handles resume implicitly. |
| Grid of the top 3 priorities as card previews | Over-surfaces planning at the end of planning. |
| "Fix all criticals" bulk-action CTA | Bulk action. Violates Phase 9 copy-only. |
| No CTA at all (list ends, student must figure out next step) | Fails the planning-to-reading bridge. |
| A progress-based CTA ("You're 58% done — keep going") | Grade framing. Percentage ban (§2.5). |
| A time-based CTA ("You have ~12 min of reading left") | Watched-clock (§2.7). |

### 2.9 Relationship To Essay-Level Overview (Phase 5, Phase 19)

**Recommendation: the product's bird's-eye story is a *three-mode model* within a single panel container. Mode A: the *overview card* (Phase 5) — the calm default gestalt, shown when the panel opens with no sentence selected; names the one strongest moment, the one most-important-next-thing, the improvement phase, and nothing else. Mode B: the *insight panel* (Phases 7–10) — the focused reading mode, shown when the student clicks a sentence; renders the Insight Card Shape. Mode C: the *list-mode* (Phase 11) — the planning mode, shown when the student taps the list toggle; renders the list + minimap + stats + CTA. All three modes share one React container, one motion system, one shortcut system, and are mutually exclusive. A future *Mode D* — the long-form *essay-level report* (Phase 19) — will live outside this panel in a dedicated surface (likely a full-page route), reserved for the post-revision retrospective or the admissions-counselor-ready deliverable, and is explicitly **not** a fourth panel mode.**

The architectural claim behind this recommendation is that one surface should render multiple modes with crossfade transitions, rather than multiple surfaces rendering one mode each. The alternative — separate pages or separate panels for overview, insight, and list — creates navigation overhead that, at the time-scale of a 20-minute review, accumulates into the thing students tell us in interviews they like least about every writing tool ("too much clicking just to see different views of the same thing").

**Why three modes in one panel:**
The three modes are three *framings of the same state* — the same essay, the same annotations, the same review progress, seen from three different zoom levels. Mode A zooms out fully (gestalt), Mode B zooms all the way in (one insight), Mode C zooms to middle distance (the map). Sharing a container makes the zoom-level change feel like a single fluid control, which matches the student's mental model of "I'm looking at this essay from different distances."

**Why Phase 19 (long-form report) is not Mode D:**
The long-form essay-level report is a different artifact. It is a generated deliverable — something the student might export, email to a counselor, or come back to days later — and its form is a long-read document, not a panel view. Forcing it into the panel would either truncate it (losing its value as a deliverable) or inflate the panel to a size that compromises Modes A–C. The report lives at a route (`/essay/:id/report`) with its own layout, and Phase 11's list-mode links to it via a secondary action, but the list itself is not the report.

**Why the list is the "operational bridge" between Mode A and Phase 19:**
Mode A (Phase 5 card) is too brief to plan revision from — it's a calming gestalt, not a work list. Phase 19 (report) is too long-form for in-session planning — it's a retrospective. Phase 11's list mode is the in-session planning tool that sits between them: dense enough to drive revision, navigable enough to support a 20-minute review session. The three artifacts form a ladder from shortest (Mode A, ~30 words of content) to medium (Phase 11 list, structured but scannable) to longest (Phase 19 report, full-prose retrospective).

**Why the toolbar surfaces only the list toggle, not all three modes:**
Modes A and B are contextual — Mode A appears automatically when the panel has no selection, Mode B appears automatically when the student clicks a sentence. Surfacing a button for Mode A would make it seem like a mode the student has to choose, but Mode A is the *default* (not a chosen mode). Surfacing a button for Mode B is unnecessary (clicking a sentence is the button). Only Mode C requires an explicit invocation, because nothing else makes the list appear — hence the single toolbar toggle for list-mode only.

**Rejected architectures:**

| Architecture | Why rejected |
|---|---|
| Three separate routes (overview / insight / list) | Navigation overhead. State splitting. Crossfade becomes page-load. |
| Tab strip at panel top (Overview / Insight / List) | Implies equivalence among contextual and invokable modes. |
| Three stacked panels (overview on top, insight middle, list bottom) | 40% right panel becomes three 13% strips. Each strip too narrow to function. |
| List embedded as a section of Phase 5's card (scroll down to see it) | Collapses Phase 5's calm contract. Puts the count back in the default. |
| List and Phase 19 report as one surface | Confuses in-session planning with post-session retrospective. Two different artifacts. |

### 2.10 Mobile List View — Primary Navigation, Inverted Relationship

**Recommendation: on mobile (viewport < 768px), list-mode's relationship to the other modes inverts. The 40%-right desktop panel does not apply; instead, the list becomes the *primary* navigation surface, rendered as a full-bleed paragraph-accordion (collapsible paragraph sections, all expanded by default on first load, collapsible on user tap) with swipeable rows within each paragraph. Tapping a row opens the Phase 7 bottom sheet with the full Insight Card. Phase 5's overview card is rendered as a collapsible card at the top of the list — a student entering the mobile annotation view sees the overview card, can tap it to expand or scroll past it to the list below. The minimap is replaced by a *paragraph dots indicator* floating right-edge (vertical column of small tier-colored dots, one per paragraph, that acts as a jump-to-paragraph scroll affordance). The list CTA at the bottom becomes a sticky footer that survives scroll.**

Mobile inverts everything about the desktop relationship because the mobile context is fundamentally different. On desktop, the student has a 40% right panel that can hold a focused insight while the essay column on the left gives spatial context — reading one-at-a-time is feasible and pleasant. On mobile, there is no side panel; every mode has to claim the full screen in turn, and reading annotations one-at-a-time on a full-screen bottom sheet produces rapid mode-switch whiplash as the student tries to remember where in the essay each insight lives.

**Why list is primary on mobile:**
A mobile student's review workflow is radically different from a desktop student's. They are probably on a commute, in bed, or between classes; they will not scroll through 30 inline annotations with a floating panel — they need a list, because the list collapses the essay into a scannable surface that works at phone-width. Making the list the primary navigation acknowledges the mobile context honestly rather than shoe-horning a desktop pattern into a screen where it doesn't fit.

**Why paragraph-accordion, not flat list:**
At phone width, a flat list of 30 rows fills 3–4 screens of scrolling. Paragraph-accordion lets the student collapse paragraphs they're not working on, keeping the list at a scannable length (typically 5–10 visible rows after selective collapse). The all-expanded-by-default choice preserves the desktop behavior for students who don't want to manage the accordion.

**Why Phase 5 overview card at the top:**
On mobile, the overview card's calming gestalt is more valuable, not less, because the mobile student is more likely to be reviewing under time pressure. The top-of-list placement means the overview card is the first thing they see on open, matching the Phase 5 contract — the calm comes first, the list is below it. A student who wants to get to the list immediately can scroll; a student who wants the gestalt has it by default.

**Why paragraph dots replace the minimap:**
A 6–8px minimap stripe on mobile would be in the wrong place (side of a portrait screen) at the wrong resolution (hard to tap). Paragraph-dot indicators at right-edge are the mobile-native version — a vertical column of small tier-colored dots (one per paragraph, tier is the paragraph's dominant annotation tier) that the student can tap to jump to that paragraph in the list. Silhouette preserved, interaction adapted.

**Why the CTA is a sticky footer on mobile:**
On desktop the footer is always visible because the panel's height accommodates it. On mobile, the list is scrollable and the footer would otherwise scroll off. Sticky footer keeps the "Start with: ¶2S3 →" CTA visible throughout scroll, which is the planning-to-reading bridge that list-mode exists to provide.

**Why tapping a row opens the Phase 7 bottom sheet (not a new page):**
The Phase 7 bottom sheet is the mobile analog to the desktop insight panel. Reusing it means the mobile reading experience is the same whether the student arrives at an insight from a direct sentence tap (in the mobile editor) or from a list row — one reading surface, two entry points.

**Rejected mobile adaptations:**

| Adaptation | Why rejected |
|---|---|
| Mobile list-mode as a separate tab in a bottom tab bar | Introduces global navigation chrome that interrupts the essay view. |
| Mobile list-mode as a modal sheet over the essay | Essay becomes inaccessible while planning. Wrong zoom model. |
| Flat list with no paragraph grouping | Scrolling overwhelm at phone width. |
| Paragraph-accordion, all-collapsed by default | First-open experience is empty-feeling. Students don't know to expand. |
| Minimap as a horizontal strip at the top of the screen | Orthogonal to scroll. Wrong spatial model. |
| Mobile-only swipe gestures for filtering | Hidden affordances. Undiscoverable without onboarding. |
| Mobile list without overview card at top | Violates Phase 5's calm-first principle on the surface it matters most. |

---

## 3. Visual & Motion Spec

### 3.1 Panel Layout In List-Mode

```
┌────────────────────────────────────────────────────────┐
│ PANEL HEADER                                           │  ← 56px, sticky
│  [← back]        Planning Mode              [🔍] [☰]  │     (filter, list-toggle)
├────────────────────────────────────────────────────────┤
│  3 / 12                                                │  ← 20px, thin label
│  ▬▬▬▬▬▬▬░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                │  ← 3px tier-gradient
│  7 of 12 reviewed · 3 resolved · 2 pending re-analysis │  ← 16px sub-copy
├────────────────────────────────────────────────────────┤
│  CRITICAL   ▬▬▬▬                    4                  │
│  NEEDS WORK ▬▬▬▬▬▬▬                 7                  │  ← histogram, ~80px
│  STRONG     ▬                       1                  │
│  EXCEPTIONAL                        0                  │
│  MASTERFUL                          0                  │
│                                                        │
│  Your strongest area is voice. Weakest is opening      │  ← L3.75 prose, 14px
│  specificity.                                          │
├────────────────────────────────────────────────────────┤
│  [Critical only]  [Unreviewed]  [Strengths]  [+]       │  ← filter chips, 36px
├────────────────────────────────────────────────────────┤
│                                                        │
│  GROUP BY [Paragraph|Tier|Type]   SORT [Priority|Doc] │  ← segmented + toggle
│                                                        │
│  ▼ Paragraph 1                                         │  ← group header, 14px
│  ● ¶1 · S2 · CRITICAL    The opening asks the…    ○    │  ← row, 52px
│  ● ¶1 · S4 · NEEDS WORK  Your hook leans on…      ●    │     ● = viewed dot
│                                                        │
│  ▼ Paragraph 2                                         │
│  ● ¶2 · S1 · NEEDS WORK  The transition here…     ●    │
│  ● ¶2 · S3 · CRITICAL    This sentence is the…    ○    │
│  ● ¶2 · S5 · STRONG      Your word choice…        ○    │
│   …                                                    │
│                                                        │
│  (list body scrolls)                                   │
│                                                        │
├────────────────────────────────────────────────────────┤
│  Start with: ¶2S3 — your highest-priority improvement →│  ← sticky CTA, 48px
└────────────────────────────────────────────────────────┘
```

### 3.2 Tokens

| Token | Value |
|---|---|
| `panel.width` | 40% of viewport ≥1024px; 100% on mobile |
| `panel.header.height` | 56px |
| `panel.header.bg` | `bg-white/60 backdrop-blur-md border-b border-stone-200/60` (glass) |
| `progress.bar.height` | 3px |
| `progress.bar.fill` | `linear-gradient(to right, #dc2626 0%, #f59e0b 28%, #84a896 52%, #22c55e 76%, #14b8a6 100%)` |
| `progress.label` | 12px / 500 / stone-500 |
| `progress.subline` | 12px / 400 / stone-400 |
| `histogram.row.height` | 16px |
| `histogram.bar.height` | 10px |
| `histogram.bar.radius` | 2px |
| `histogram.label.width` | 96px (left-aligned tier word) |
| `histogram.count.width` | 32px (right-aligned count) |
| `prose.synth.size` | 14px / 400 / stone-600 / italic-off |
| `chip.height` | 32px |
| `chip.gap` | 8px |
| `group.header.height` | 32px |
| `group.header.style` | 14px / 600 / stone-800 / caret-left (▼/▶) |
| `row.height` | 52px |
| `row.dot.size` | 10px |
| `row.dot.gap` | 12px |
| `row.meta.size` | 12px / 500 / stone-500 |
| `row.critique.size` | 14px / 400 / stone-900 |
| `row.critique.clip` | 60ch with 40px fade-to-transparent |
| `row.viewed.dot.size` | 6px |
| `row.viewed.dot.filled` | stone-300 |
| `row.viewed.dot.outline` | stone-200 |
| `row.hover.bg` | `bg-stone-50/80` |
| `minimap.width` | 7px |
| `minimap.block.height` | 4px |
| `minimap.block.gap` | 1px |
| `minimap.right.offset` | 0 (flush inside scrollbar gutter) |
| `cta.height` | 48px |
| `cta.bg` | `bg-white/90 backdrop-blur-md border-t border-stone-200/60` |
| `cta.text` | 14px / 500 / stone-900 |

### 3.3 Crossfade — Mode Transitions

All three modes (overview card, insight panel, list-mode) use the same 180ms crossfade (from Phase 7), with the same easing.

```ts
// src/components/AnnotationPanel/ModeTransition.tsx
const MODE_TRANSITION = {
  duration: 0.18,
  ease: [0.4, 0.0, 0.2, 1] as const, // cubic-bezier standard
};

type PanelMode = 'overview' | 'insight' | 'list';

export function PanelModeContainer({ mode, children }: Props) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={mode}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={MODE_TRANSITION}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

Latest-wins rule from Phase 7 applies verbatim: a second mode transition during an in-flight transition cancels the first and starts the second from whatever opacity the first had reached.

### 3.4 Minimap Render

```ts
// src/components/AnnotationPanel/Minimap.tsx
interface MinimapBlock {
  sentenceId: string;
  tier: Tier;
  topPercent: number;      // position down the essay (0..100)
  heightPercent: number;   // fraction of scroll length this sentence occupies
}

// Only rendered when listModeActive === true
export function Minimap({ blocks, onBlockClick }: MinimapProps) {
  return (
    <motion.div
      className="absolute top-0 right-0 h-full w-[7px] pointer-events-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
    >
      {blocks.map(b => (
        <button
          key={b.sentenceId}
          className={`absolute left-0 right-0 ${tierBg(b.tier)} rounded-[1px] hover:scale-x-[1.6] transition-transform`}
          style={{ top: `${b.topPercent}%`, height: `max(4px, ${b.heightPercent}%)` }}
          onClick={() => onBlockClick(b.sentenceId)}
          aria-label={`Jump to annotation ${b.sentenceId}`}
        />
      ))}
    </motion.div>
  );
}
```

Hover on a minimap block scales it horizontally by 1.6x and reveals a tooltip (the meta: `¶2 · S3 · NEEDS WORK`) after 200ms dwell.

### 3.5 List ↔ Overview / Insight Transitions

| From | To | Trigger | Transition |
|---|---|---|---|
| Overview | List | Toolbar toggle click | 180ms crossfade, minimap fades in |
| List | Overview | Toolbar toggle click again (no sentence selected) | 180ms crossfade, minimap fades out |
| List | Insight | List row click OR minimap block click OR CTA click | 180ms crossfade, editor scrolls to sentence (parallel), minimap fades out |
| Insight | List | Toolbar toggle click | 180ms crossfade, minimap fades in |
| Overview | Insight | Sentence click in editor | 180ms crossfade (unchanged from Phase 7) |
| Insight | Overview | Panel close button OR Escape | 180ms crossfade (unchanged from Phase 7) |

### 3.6 Filter Chip Behavior

Chips are one-tap toggles with AND composition. Active chip: filled tier-color background with white text. Inactive chip: stone-100 background with stone-700 text. Transition: 120ms color-change on click. Each chip has a small count badge on the right (`Critical only (4)`) that updates live.

### 3.7 Group Header Animation

Clicking a paragraph group header (`▼ Paragraph 2`) collapses that group with a 200ms height-interpolation from full-height to 0. Caret rotates from ▼ to ▶ in the same duration. All groups are expanded by default on list-mode open.

### 3.8 Histogram Render

```ts
interface TierCount {
  tier: Tier;
  label: string;  // 'CRITICAL' | 'NEEDS WORK' | ...
  count: number;
}

export function TierHistogram({ tiers }: { tiers: TierCount[] }) {
  const maxCount = Math.max(...tiers.map(t => t.count), 1);
  return (
    <div className="px-6 py-4 space-y-1.5">
      {tiers.map(t => {
        const widthPct = (t.count / maxCount) * 100;
        return (
          <div key={t.tier} className="flex items-center gap-3 h-4">
            <span className="w-24 text-[12px] font-medium text-stone-500 tabular-nums">
              {t.label}
            </span>
            <div className="flex-1 h-2.5 bg-stone-100 rounded-[2px] overflow-hidden">
              <motion.div
                className={`h-full ${tierBg(t.tier)} rounded-[2px]`}
                initial={{ width: 0 }}
                animate={{ width: `${widthPct}%` }}
                transition={{ duration: 0.42, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
            <span className="w-8 text-right text-[12px] font-medium text-stone-700 tabular-nums">
              {t.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
```

Bar growth animation on list-mode open is 420ms (longer than panel crossfade — the bars settle after the container has arrived).

### 3.9 CTA Sticky Footer

The CTA is rendered as a sticky bottom bar with glass background. On row hover (if the hovered row is the CTA target), the CTA receives a subtle 2% brightness bump to confirm the relationship. Clicking the CTA fires `openInsight(ctaTarget)`, crossfading to insight-mode.

### 3.10 Easing & Durations Summary

| Motion | Duration | Easing |
|---|---|---|
| Mode crossfade | 180ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Minimap fade-in / fade-out | 180ms | same |
| Histogram bar growth | 420ms | same |
| Filter chip color change | 120ms | `linear` |
| Group header collapse | 200ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Row hover bg | 120ms | `linear` |
| Minimap block hover scale | 150ms | same standard curve |
| Re-analysis row highlight (NEW/UPDATED arrival) | 300ms shimmer + 1200ms hold | `cubic-bezier(0.2, 0, 0.2, 1)` + linear hold |
| CTA target sentence change (on view progress) | 140ms crossfade on CTA text | standard curve |

### 3.11 Row State Machine

Each list row has five observable states, each mapped to a single visual rendering. The states are exclusive (a row is in exactly one state at any time).

| State | Viewed-dot | Row bg | Badge | Notes |
|---|---|---|---|---|
| `unviewed` | hollow stone-200 | default | — | Initial state for every annotation |
| `viewed` | filled stone-300 | default | — | Commits on panel close, per Phase 10 |
| `re-analysis-pending` | same as prior | default | `PENDING` 10px stone-400 in badge slot | Sentence edited, queued for Phase 15 |
| `re-analysis-new` | hollow (reset) | 300ms shimmer → default | `NEW` 10px stone-500 | Re-analysis arrived, previously no annotation on this sentence |
| `re-analysis-updated` | retains prior viewed state | 300ms shimmer → default | `UPDATED` 10px stone-500 | Re-analysis changed tier or critique |

Transitions are one-directional within a review: `unviewed → viewed` on panel close; `viewed → re-analysis-pending` on sentence edit; `re-analysis-pending → (re-analysis-new | re-analysis-updated)` on re-analysis complete; the `NEW`/`UPDATED` badge clears on next view.

### 3.12 Keyboard Shortcuts In List-Mode

List-mode inherits Phase 10's keyboard vocabulary with three list-specific additions. All shortcuts are surfaced in Phase 6's shortcuts-panel after the first list-mode exit.

| Key | Action |
|---|---|
| `L` (or `Shift+L`) | Toggle list-mode from any other mode |
| `↑` / `↓` | Move focus between list rows (not essay scroll — focus is trapped in the panel) |
| `Enter` / `Space` | Open the focused row's insight |
| `Esc` | Exit list-mode back to overview (if no sentence selected) or insight (if sentence selected before list was opened) |
| `/` | Focus the filter-menu (`+`) as a search surface |
| `1` / `2` / `3` | Toggle the three filter chips (Critical only / Unreviewed / Strengths) |
| `g` then `p` / `t` / `y` | Switch grouping to Paragraph / Tier / Type (vim-like two-key chord, discoverable in shortcuts panel) |
| `Tab` | Advance within list focus (rows), matching Phase 10's queue-advance semantic at list scope |

The `L` toggle is the primary discovery path for keyboard-first users — pressed once, the student has found list-mode. No chord, no modifier, no mnemonic needed beyond the letter itself.

### 3.13 Accessibility Contract

| Surface | A11y treatment |
|---|---|
| Panel mode change | `aria-live="polite"` announces new mode ("Planning mode. 12 annotations.") |
| Progress bar | `role="progressbar"` with `aria-valuenow`, `aria-valuemin=0`, `aria-valuemax=totalCount`, `aria-label="Review progress"` |
| Histogram | `role="img"` with `aria-label="Tier distribution: 4 critical, 7 needs work, 1 strong"` (prose summary, not per-bar labels) |
| Synthesis prose | regular text, auto-read by screen readers in document flow |
| Filter chips | `role="button"` with `aria-pressed` reflecting active state |
| Group headers | `role="button"` with `aria-expanded` reflecting collapse state |
| List rows | `role="button"` with `aria-label` including full meta, tier, critique first line, and viewed status |
| Minimap | `aria-hidden="true"` at container; individual blocks reachable via keyboard with `aria-label` (see §9.14) |
| CTA | `role="link"` (it navigates-within-panel to an insight), labelled with full sentence target |

Focus order on list-mode open: close-button → toolbar-toggle → filter-chip-1 → filter-chip-2 → filter-chip-3 → `+` → segmented group control → sort toggle → first row → (rows in order) → CTA.

### 3.14 Performance Budget

| Metric | Budget | Rationale |
|---|---|---|
| Time-to-list-render on toggle click | ≤ 280ms | Perceptual continuity with the 180ms crossfade |
| List scroll (30 rows) FPS | ≥ 58 | Sub-frame-budget per row; virtualization only activates at N > 60 |
| Filter chip toggle latency | ≤ 16ms | Client-side only, pure `useMemo` over in-memory annotations |
| Minimap first paint | ≤ 60ms after list-mode open | Positions are cheap (O(N) over sentence spans already in DOM) |
| Synthesis prose fetch (first open per version) | ≤ 1.2s p95 | L3.75 sub-call; list renders with placeholder skeleton, prose replaces on arrival |
| Re-render on single-row state change | ≤ 4ms | Memoization per row; only changed row re-renders |

List virtualization (`react-virtuoso` or equivalent) is **not** enabled by default — the expected range (10–30 annotations) does not justify virtualization's complexity cost. Virtualization kicks in only when `annotations.length > 60`, a threshold that effectively never trips for Common App essays but protects against pathological supplemental responses.

---

## 4. Copy Deck

### 4.1 Header & Mode Labels

| Element | Copy |
|---|---|
| Panel title (list-mode) | `Planning mode` |
| Toolbar toggle aria-label | `Open list view of all feedback` |
| Toolbar toggle aria-label (when active) | `Close list view and return to reading` |

### 4.2 Progress Copy

| Element | Copy |
|---|---|
| Progress fraction | `7 / 12` |
| Progress sub-line | `7 of 12 reviewed · 3 resolved · 2 pending re-analysis` |
| Sub-line when no resolved yet | `7 of 12 reviewed` |
| Sub-line when all reviewed, some resolved | `All 12 reviewed · 3 resolved` |
| Sub-line with pending only | `12 reviewed · 2 pending re-analysis` |

### 4.3 Tier Histogram Labels

Tier labels use the canonical Phase 6 forms verbatim:

| Tier | Label |
|---|---|
| CRITICAL | `CRITICAL` |
| NEEDS WORK | `NEEDS WORK` |
| STRONG | `STRONG` |
| EXCEPTIONAL | `EXCEPTIONAL` |
| MASTERFUL | `MASTERFUL` |
| FUNCTIONAL | *(excluded from histogram — sage/no-underline tier is not actionable)* |

### 4.4 L3.75 Prose Line (Templates)

The prose line is generated at L3.75 and follows one of these shapes (the model picks the one that best fits the essay):

- `Your strongest area is {strongest_dimension}. Weakest is {weakest_dimension}.`
- `{strongest_dimension} is consistent throughout. {weakest_dimension} needs the most attention.`
- `You're strongest at {strongest_dimension} — {weakest_dimension} is where the revision will pay off most.`

Guardrails enforced in the prompt:
- No aggregate scores, no percentages, no letter grades.
- No more than two dimensions named.
- No second sentence beyond the template.
- Dimension names drawn from the 11-dimension rubric, in student-facing phrasing (not internal taxonomy).

### 4.5 Filter Chip Labels

| Chip | Copy | Count format |
|---|---|---|
| Critical only | `Critical only` | `(4)` |
| Unreviewed | `Unreviewed` | `(5)` |
| Strengths | `Strengths` | `(3)` (STRONG + EXCEPTIONAL + MASTERFUL) |
| All filters | `+` | *(icon, no label)* |

### 4.6 Group Headers

| Grouping | Header format |
|---|---|
| By paragraph | `Paragraph 1`, `Paragraph 2`, … |
| By tier | `Critical`, `Needs work`, `Strong`, `Exceptional`, `Masterful` |
| By type | `Voice`, `Craft`, `Structure`, `Content` |

### 4.7 Empty States

| State | Copy |
|---|---|
| No annotations at all | `No feedback yet. Your essay is being analyzed.` (should not appear — list toggle is disabled pre-analysis) |
| All filtered out | `No feedback matches these filters. Try clearing one.` |
| All criticals reviewed (filter = Critical only) | `You've read all the critical notes. Nice work.` |
| All unreviewed done (filter = Unreviewed) | `You've read everything. Hit the summary below for what to start on.` |
| No strengths in essay (filter = Strengths) | `No strong-or-better moments flagged in this pass.` (rare; worth telling the truth) |

### 4.8 CTA Copy

| State | Copy |
|---|---|
| Default (unreviewed CRITICAL exists) | `Start with: ¶{P}S{N} — your highest-priority improvement →` |
| No unreviewed CRITICAL, unreviewed NEEDS WORK exists | `Start with: ¶{P}S{N} — your next priority →` |
| No unreviewed CRITICAL or NEEDS WORK, unreviewed STRONG exists | `Next up: ¶{P}S{N} — worth a read →` |
| All reviewed | `Most important: ¶{P}S{N}. Start there →` (Phase 10 end-of-review form) |

### 4.9 Tooltip Copy (Minimap)

| Element | Copy |
|---|---|
| Minimap block hover | `¶{P} · S{N} · {TIER}` (identical to list row meta) |

### 4.10 Segmented Control Copy

| Control | Copy |
|---|---|
| Group-by segmented | `Paragraph ⎮ Tier ⎮ Type` |
| Sort toggle | `Priority` ↔ `Doc order` |

### 4.11 Viewed / Re-Analysis Badges

| Badge | Copy |
|---|---|
| Re-analysis arrival (inset, next to viewed-dot) | `NEW` (10px uppercase stone-500) |
| Re-analysis updated (same as Phase 10) | `UPDATED` (10px uppercase stone-500) |

### 4.12 Forbidden Copy (Do Not Ship)

| Phrase | Why forbidden |
|---|---|
| `Your essay scored 78/100` | Aggregate score ban (§2.5) |
| `Grade: B+` | Letter grade ban |
| `68% complete` | Percentage ban |
| `Fix all criticals` | Bulk-action ban (Phase 9 copy-only) |
| `Apply all suggestions` | Bulk-action ban |
| `3 issues, 2 warnings, 1 suggestion` | Issue/warning/suggestion taxonomy is not the tier vocabulary |
| `You're 58% done — keep going!` | Percentage + gamification |
| `Great job!` / `Keep going!` / `Almost there!` | Gamification / wrong register |
| `Task complete` | Task-list framing |
| `0 left` | Zero-remaining count (use `All 12 reviewed` instead) |
| `Estimated 8 min remaining` | Watched-clock timer |
| `Your essay is getting better!` | Evaluative claim product cannot verify |
| `Compared to peer essays…` | Comparison framing |

---

## 5. Mobile Adaptation

### 5.1 Breakpoint & Structural Change

List-mode's structural rules switch at `768px`. Below that width, the 40%-right panel is removed entirely; the list becomes a full-bleed primary surface with three layered components (overview card → list → CTA).

### 5.2 Mobile Layout

```
┌──────────────────────────┐
│ [☰] Planning mode   [×]  │  ← header, 48px
├──────────────────────────┤
│                          │
│  ┌────────────────────┐  │
│  │ Overview card     ▼│  │  ← Phase 5 card, collapsible, expanded default
│  │ "Your strongest…"  │  │
│  │ Start here: ¶3S2   │  │
│  │ Foundation phase   │  │
│  └────────────────────┘  │
│                          │
│  7 / 12                  │
│  ▬▬▬▬▬░░░░░░░░░░░░░░    │  ← progress
│  7 reviewed · 3 resolved │
│                          │
│  [Crit][Unread][Strgth]  │  ← chips (smaller)
│                          │
│  ▼ Paragraph 1           │
│  ● ¶1·S2·CRITICAL        │
│    The opening asks…     │
│  ● ¶1·S4·NEEDS WORK      │
│    Your hook leans…      │
│                          │
│  ▼ Paragraph 2           │
│  …                       │
│                          │
│ (scrolls)                │
│                          │
├──────────────────────────┤
│ Start with: ¶2S3 →       │  ← sticky CTA footer
└──────────────────────────┘
        •                    ← floating paragraph dots
        •  (right edge)
        •
        •
```

### 5.3 Mobile Row Layout

Mobile rows are two-line (instead of desktop's one-line) because the row is now full-bleed and can breathe:

Line 1: `● ¶1 · S2 · CRITICAL`
Line 2: `The opening asks the reader to do emotional work…`

Row height: 64px (vs 52px on desktop). Viewed-dot moves to left-of-dot position on line 1.

### 5.4 Paragraph Dots Indicator (Mobile)

Right-edge floating vertical column of small dots (8px circles, 8px gap), one per paragraph. Dot color = paragraph's dominant annotation tier. Tapping a dot smoothly scrolls the list to that paragraph's group header. Current-paragraph dot is filled; others are 50% opacity.

### 5.5 Tap → Bottom Sheet

Tapping a list row on mobile opens the Phase 7 mobile bottom sheet (full Insight Card Shape). The sheet is swipe-down-to-dismiss. Dismissing the sheet returns to the list at the same scroll position, with the just-viewed row's viewed-dot now filled.

### 5.6 Filter Chips (Mobile)

Mobile filter chips are smaller (28px height) and use shortened labels to fit three chips in the mobile width: `Crit`, `Unread`, `Strgth`, `+`. Tap targets are still ≥44px (extend beyond the visible chip bounds).

### 5.7 Mobile Removes

- Minimap stripe is removed on mobile (paragraph dots replace it).
- Hover-on-row-adds-ring is removed (no hover on touch).
- Keyboard shortcuts are removed (no keyboard).
- Segmented control (Group by Paragraph/Tier/Type) is collapsed into a `[Group ▾]` menu.

### 5.8 Mobile-Only Behaviors

- **Pull to refresh** at the top of the list triggers focused re-analysis (Phase 15). Mobile-only because pull-to-refresh is a mobile idiom.
- **Swipe-down-close** on the overview card collapses it (to give the list more vertical room).
- **Long-press on a row** (≥350ms) opens a small tier-colored ring on the corresponding sentence in the previously-viewed editor scroll position — a mobile analog to desktop hover-preview. Release without moving = cancel; release after moving to the minimized editor thumb = commit scroll.
- **Two-finger pinch down** on the list collapses all paragraph groups at once (a bulk collapse gesture discoverable by habit transfer from photo apps). Pinch up re-expands all.

### 5.9 Mobile Touch Target Audit

| Element | Visible size | Touch target | Notes |
|---|---|---|---|
| Filter chip | 28px h × ~56px w | 44px × 60px (padded) | Standard iOS/Android min |
| Row | 64px h × full-width | 64px h × full-width | Row height *is* the target |
| Paragraph-dot indicator | 8px dot | 32px circular hit area | Dots cluster, hit areas expanded without visible change |
| Group header caret | 20px | 44px h × full-width | Whole header row is the target |
| Overview card collapse | Card header area | 48px h × full-width | |
| CTA | 48px h | 48px h × full-width | |
| Bottom sheet swipe handle | 4px h × 36px w | 24px h × full-width | Standard sheet handle ergonomics |

All touch targets meet the 44×44pt minimum (iOS HIG) / 48dp minimum (Material). Where visual size is smaller, hit areas are expanded via invisible padding.

### 5.10 Mobile Synthesis Prose Handling

On mobile, vertical budget is the scarcest resource. The L3.75 synthesis prose (one line on desktop) may wrap to 2 lines at phone width. Truncation policy: never truncate — always wrap — but cap at 2 lines with `line-clamp-2` as a last-resort guard against unexpectedly long synthesis output. The §6.10 server guardrail (`≤ 200 chars, ≤ 28 words`) makes the wrap consistently fit in 2 lines at typical phone widths (375–428px).

### 5.11 Mobile Minimap Replacement (Paragraph Dots) Details

The floating paragraph-dot column occupies the right 16px of the mobile viewport (8px dot + 8px inset gap). It renders with `position: fixed` pinned to the right edge of the list scroll area, vertically centered within the list's visible region. Dot colors encode the paragraph's *dominant* tier — computed as the highest-priority tier present in that paragraph's annotations, with CRITICAL beating NEEDS WORK beating STRONG. The current-scroll-paragraph's dot is rendered at 100% opacity with a 1px outline; all others are at 50% opacity. Tapping a dot scrolls the list to the corresponding group header with a 280ms smooth-scroll. The dot column auto-hides during active scroll (opacity 0 during `scrollEvent` rapid-fire) and fades back in (`opacity 1`, 180ms) after 400ms of scroll-stop — a scroll-hide pattern that keeps the dots useful without cluttering the read during active scrolling.

---

## 6. Backend Requirements

### 6.1 Aggregate Statistics Shape

```ts
// src/services/essayIntelligence/types.ts
interface ListModeAggregate {
  essayId: string;
  totalAnnotations: number;
  reviewedCount: number;        // viewed persisted in Phase 10
  resolvedCount: number;        // annotations whose sentence has been edited since generation
  pendingReanalysisCount: number; // queued in Phase 15
  tierBreakdown: Record<Tier, number>;
  typeBreakdown: Record<AnnotationType, number>;
  paragraphBreakdown: Array<{
    paragraphNumber: number;
    annotationCount: number;
    dominantTier: Tier;
    sentenceRange: [number, number];
  }>;
  synthesisProse: string;       // L3.75-generated, ≤200 chars, no aggregate score
  synthesisGeneratedAt: string; // ISO timestamp
}
```

The aggregate is computed server-side on annotation save (append-only — invalidated on re-analysis) and cached under `essay_aggregate_stats` keyed by `(essay_id, analysis_version)`.

### 6.2 L3.75 Synthesis Prompt Contract

The synthesis prose is produced by a dedicated L3.75 sub-call (after the main L3.75 holistic synthesis) with a tight system prompt:

```
SYSTEM: Produce a single-line prose synthesis naming the essay's strongest
and weakest writing dimensions. Hard constraints:
- No numeric scores, percentages, letter grades, or composite ratings.
- No more than 2 dimensions named.
- 1 sentence, ≤200 characters, ≤28 words.
- Use student-facing dimension phrasing from the 11-dimension rubric.
- Do not use the words "score", "grade", "rating", "overall", "total".
INPUT: { holistic: HolisticSynthesis, tierBreakdown: Record<Tier, number> }
OUTPUT: { prose: string, strongestDimension: string, weakestDimension: string }
```

Server validates the output matches the constraints before persisting; violations trigger one retry with the violation fed back to the model, per the "self-fixing" error recovery pattern (MEMORY.md essay-intelligence v2 notes).

### 6.3 Order Payload (Smart Order Inheritance)

List-mode reuses Phase 10's `computeSmartOrder(essayId, annotations)` primitive, which already exists. List-mode additionally requires a paragraph-grouped ordering:

```ts
interface ListModeOrder {
  flatOrder: string[];                          // annotation IDs in Smart Order (reused from Phase 10)
  groupedByParagraph: Array<{                   // group-by-paragraph default
    paragraphNumber: number;
    annotationIds: string[];                    // within-group priority order
  }>;
  groupedByTier: Array<{
    tier: Tier;
    annotationIds: string[];                    // within-group document order
  }>;
  groupedByType: Array<{
    type: AnnotationType;
    annotationIds: string[];                    // within-group priority order
  }>;
}
```

All four orderings are computed once on list-mode open and cached client-side for the session; a re-sort toggle flips between pre-computed orderings without a round-trip.

### 6.4 Progress Persistence

`reviewedCount`, `resolvedCount`, and `pendingReanalysisCount` are persisted per-annotation and rolled up to the aggregate via trigger:

```sql
-- migration: add list_mode progress columns
alter table essay_annotations add column viewed_at timestamptz null;
alter table essay_annotations add column resolved_at timestamptz null;
alter table essay_annotations add column reanalysis_queued_at timestamptz null;

create index idx_annot_essay_viewed on essay_annotations(essay_id) where viewed_at is not null;
create index idx_annot_essay_resolved on essay_annotations(essay_id) where resolved_at is not null;
create index idx_annot_essay_pending on essay_annotations(essay_id) where reanalysis_queued_at is not null;
```

Trigger `essay_annotation_rollup_tg` updates `essay_aggregate_stats` on any column change.

### 6.5 Minimap Data

Minimap block positions require per-sentence scroll-offset percentages, which are computed client-side (not backend) from the essay's rendered DOM at list-mode open time. The backend provides only `sentenceId → (paragraphNumber, sentenceNumber, tier)`; positioning is a render-time concern.

### 6.6 Filter State

Filter chips are client-side only (no backend filtering round-trip). The full annotation set is already in memory from Phase 7's load; filters apply as `useMemo` over that set.

### 6.7 API Surface

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/essays/:id/aggregate` | GET | Returns `ListModeAggregate`. Cached with `analysis_version` key. |
| `/api/essays/:id/annotations/:annotId/viewed` | POST | Marks viewed (Phase 10 — already exists). |
| `/api/essays/:id/order` | GET | Returns `ListModeOrder`. Computed on demand, cheap (pure function of annotations). |
| `/api/essays/:id/synthesis` | POST | Invokes L3.75 synthesis sub-call. Only called on first list-mode open per analysis version. |

### 6.8 Invalidation Rules

| Event | Cache keys invalidated |
|---|---|
| Annotation viewed | `essay_aggregate_stats(essay_id)` reviewedCount only; row-level cache for that annotation |
| Sentence edit (any edit in essay_text) | `essay_aggregate_stats(essay_id)` resolvedCount + pendingReanalysisCount for affected annotations |
| Focused re-analysis complete | `essay_aggregate_stats(essay_id)` pendingReanalysisCount decrement; per-annotation body replaced; synthesis prose invalidated if tier distribution shifted by ≥2 annotations |
| Full re-analysis (new `analysis_version`) | All caches under the essay keyed by old version are purged; synthesis prose regenerated on next open |

The ≥2 annotations threshold on synthesis invalidation is a deliberate cost-saving: a single tier flip between two adjacent tiers (e.g. one NEEDS WORK → STRONG) rarely changes which dimension is named strongest or weakest, and re-running L3.75 for a single swap burns budget without changing the output. Threshold is tunable in server config.

### 6.9 Event Telemetry (feeds Phase 13)

| Event name | Payload | Meaning |
|---|---|---|
| `list_mode.open` | `{essayId, analysisVersion, openedVia: 'toolbar' \| 'keyboard' \| 'cta' \| 'mobile-tab'}` | Student invoked list-mode |
| `list_mode.close` | `{essayId, dwellMs, rowsClicked, filtersUsed: string[]}` | Student exited list-mode |
| `list_mode.row_click` | `{essayId, annotationId, indexInList, grouping}` | Student clicked a row to open an insight |
| `list_mode.filter_toggle` | `{essayId, chipId, active: boolean, filtersAfter: string[]}` | Filter chip state change |
| `list_mode.group_change` | `{essayId, newGrouping: 'paragraph' \| 'tier' \| 'type'}` | Segmented control change |
| `list_mode.minimap_click` | `{essayId, annotationId}` | Minimap block jump |
| `list_mode.cta_click` | `{essayId, ctaTargetAnnotationId, progressAtClick: [reviewed, total]}` | CTA committed |
| `list_mode.synth_render` | `{essayId, analysisVersion, latencyMs}` | L3.75 prose rendered (post-skeleton) |

These events feed Phase 13's telemetry plan; the specific aggregates Wave 4 will need are `list_mode open rate per session`, `median dwell`, `filter-then-click conversion`, `CTA-click-to-view path`, and `minimap usage share`. None of the events collect essay text or PII beyond the essay ID.

### 6.10 Server-Side Guardrails For The Synthesis Prose

The L3.75 prose line is the single piece of server-generated copy in list-mode. Because it is displayed prominently and because the §4.12 forbidden phrases are a hard product contract, the server enforces three validation gates before persisting the prose:

1. **Forbidden-substring check** (regex): reject if the output contains `/\b(score|grade|rating|overall|total|issue|warning|\d+%|\d+\/\d+|\d+ out of)\b/i`.
2. **Length check**: reject if `prose.length > 200` or `wordCount > 28`.
3. **Dimension check**: reject if the output does not name exactly one `strongestDimension` and one `weakestDimension` that map to known 11-dimension rubric keys.

On rejection, the self-fixing pattern applies: the server sends the output and the specific violation back to the model via Haiku for one repair pass, then re-validates. A second rejection falls back to a deterministic template (`Your strongest area is {top}. Weakest is {bottom}.`) populated from the raw tier breakdown, ensuring the list never ships without a prose line.

---

## 7. Relationship Map

### 7.1 Inheritance From Phase 5 (Overview Card)

List-mode is the *explicit* alternative to the Phase 5 overview card. Both render in the same panel container. Phase 5 is the default (no user action required); list-mode is invokable (toolbar toggle). Phase 5's calm contract — no counts, no percentages, no aggregate — does not transfer to list-mode; list-mode is where counts live, because the student opted in. The two modes crossfade bidirectionally: close list-mode with no sentence selected → Phase 5 card; open list-mode → Phase 5 card slides out.

### 7.2 Inheritance From Phase 7 (Click-Panel)

Clicking a list row is the same primitive as clicking a sentence underline in the editor — `openInsight(annotationId)`. The 180ms crossfade is the same crossfade. The latest-wins rapid-click rule is the same. The Insight Card Shape (Phase 8) renders the same. List rows are a second entry point to the same reading surface; they are not a second reading surface.

### 7.3 Inheritance From Phase 10 (Navigation)

Smart Order from Phase 10 is the list's default sort. The thin 3px tier-gradient progress bar from Phase 10 is list-mode's progress bar, rendered byte-identically. The end-of-review CTA from Phase 10 (`Most important: ¶3S2. Start there →`) is list-mode's CTA when all annotations are reviewed. Phase 10 is the per-insight navigation; Phase 11 is the global-view navigation; they share primitives.

### 7.4 Feeds Into Phase 15 (Focused Re-Analysis)

When the student edits a sentence, the `resolvedCount` increments and the annotation enters `pendingReanalysisCount` when Phase 15 queues it. The list is the only surface where the student sees `pending re-analysis` as an explicit state — the sub-line under the progress bar is the UI for this hook. When re-analysis completes and the annotation returns with a changed tier or new content, the list row gets a `NEW` (or `UPDATED`) badge, visible until viewed. Phase 15 is functional without Phase 11, but Phase 11 is where its output becomes legible to the student.

### 7.5 Feeds Into Phase 19 (Future Essay-Level Report)

The long-form essay-level report is the third artifact in the ladder: Phase 5 (shortest, ~30 words), Phase 11 (medium, structured list + minimap), Phase 19 (longest, full-prose retrospective). Phase 19 lives at a dedicated route; Phase 11 links to it via a secondary action in the list header (`View full report →`, added when the student reaches 12/12 reviewed). Phase 11 is not Phase 19 in miniature; it is a different artifact that will exist alongside Phase 19 when Phase 19 ships.

### 7.6 Visual Summary Of The Three-Mode Model

```
                              (one React container)
                    ┌─────────────────────────────────────┐
                    │            AnnotationPanel          │
                    │                                     │
   sentence click → │   Mode B: insight panel            │ ← toolbar close
                    │   (Phases 7–10)                    │
                    │                                     │
      no-selection →│   Mode A: overview card            │ ← default
   (default open)   │   (Phase 5)                        │
                    │                                     │
  toolbar toggle → │   Mode C: list-mode                 │ ← toolbar toggle off
                    │   (Phase 11)                        │
                    └─────────────────────────────────────┘
                                    │
                                    │ (future, at-route)
                                    ▼
                    ┌─────────────────────────────────────┐
                    │   /essay/:id/report                 │
                    │   (Phase 19, future)                │
                    └─────────────────────────────────────┘
```

---

## 8. Emotional Map

### 8.1 The Planning Posture

The student entering list-mode is doing one of three things (from §2.1 beta telemetry): mid-review recalibration, return-after-edit, or planning-before-revise. All three are *survey* moments — the student is stepping back from close reading. The emotional register of list-mode should match this posture: deliberate, calm, and informative, but not evaluative.

The emotional failure modes list-mode can fall into:

| Failure | Cause | Symptom |
|---|---|---|
| **Overwhelming** | Aggregate score visible, percentage complete visible, long unscrollable list | Student closes the tab |
| **Judgmental** | Letter grade, issue/warning/suggestion taxonomy, bulk-fix actions | Student feels graded, not taught |
| **Gamified** | Streaks, XP, "Great job!" copy, progress percentage | Student feels patronized |
| **Empty** | No synthesis prose, no CTA, no guidance on what to do next | Student feels unguided, bails |
| **Noisy** | Too many filter chips, heatmap, thumbnails, competing color systems | Student feels distracted, defers |
| **Generic** | Phrases that could apply to any essay, no specificity | Student feels unseen, disengages |

The design of list-mode is the negative space of this table. Every rejection in §2 is a guard against one of these failure modes.

### 8.2 The Three Moments Of Planning Mode

**First open (minute 0 of planning):** The student is transitioning from reading to planning. The list's top (overview card, progress bar, histogram, prose line) should confirm the scope of the work in a single glance, without judgment. *Emotional target: "Okay, I see the shape now."*

**Mid-scroll (minute 1–3):** The student is scanning the list rows. Rows should be dense enough to compare but calm enough to not feel like a bug list. *Emotional target: "I can see what's there, and it's manageable."*

**Bottom reach (minute 3+):** The student has seen the whole list. The CTA at the bottom tells them exactly where to re-engage. *Emotional target: "I know where to start."*

### 8.3 The Empowerment / Overwhelm Axis

Every element in list-mode sits on a spectrum between empowering ("I understand the shape of the work and can act on it") and overwhelming ("There is too much here and I don't know where to start"). The spec's opinionated choices are plotted:

| Element | Direction |
|---|---|
| Tier histogram (showing 4 criticals) | Empowering — concrete, scoped, scannable |
| Aggregate score (78/100) | Overwhelming — anchors identity to a number |
| L3.75 prose line ("voice strong, opening weak") | Empowering — names two things only |
| List of 12 rows with truncated critiques | Empowering — scannable, finite |
| Unscrollable list of 50 items | Overwhelming — no sense of boundary |
| Single CTA ("Start with: ¶2S3 →") | Empowering — collapses choice |
| Three-way CTA fork | Overwhelming — adds decision cost at the wrong moment |
| Thin 3px tier-gradient progress bar | Empowering — present but peripheral |
| Floating "9 remaining" overlay | Overwhelming — task-list framing |
| Viewed-dot (hollow→filled) | Empowering — progress without judgment |
| Checkmarks on viewed rows | Overwhelming — task-completion vocabulary |
| Minimap silhouette (6–8px stripe) | Empowering — peripheral confirmation |
| Heatmap wash on sentences | Overwhelming — second color system |

The list-mode spec sits firmly in the empowering column on every row. The single most important emotional rule is the §2.5 ban on aggregate score / percentage / grade — the single fastest way to push a 16-year-old into the overwhelmed column is to show them a number that claims to summarize their college essay.

### 8.4 The Closing Feeling

A student who exits list-mode should feel three things, in this order: *oriented* (I saw the shape), *confident* (I know what to do next), *calm* (I don't have to do it all at once). Every copy choice, motion choice, and layout choice in this document is tuned to produce those three feelings in that order.

---

## 9. Open Questions For Wave 4

### 9.1 How Long Is The Synthesis Prose Live-Editable?

L3.75 produces the `synthesisProse` on first list-mode open per analysis version. If the student opens list-mode, edits the essay, comes back to list-mode — does the prose re-generate, or hold? Arguments for holding (stable mental model, cheaper); arguments for regenerating (accurate at the current state). Resolution: instrument it first (Phase 13 telemetry on synth-view-count per session) before committing.

### 9.2 Does Group-By-Type Survive Rubric Evolution?

The 11-dimension rubric is the current taxonomy; the four-type grouping (voice / craft / structure / content) is a coarser student-facing grouping. If the rubric evolves (Phase 14 possibilities), does the Type grouping follow, or stay fixed as a simplified lens? Resolution: define the Type grouping as a *view*, not a *schema* — it can be recomputed on rubric changes without migrating annotation data.

### 9.3 Should The Minimap Extend To Non-Annotated Sentences?

Current spec: minimap blocks only for annotated sentences. Alternate: minimap blocks for *every* sentence (colored by tier if annotated, pale gray if not), giving a truer silhouette of the essay. Argument for extending: more spatial context. Argument against: dilutes the "annotations only" signal and introduces a new visual element (gray blocks) that has no click handler and carries no information. Resolution: ship as annotations-only; revisit if beta users report spatial confusion.

### 9.4 How Does List-Mode Behave During A Focused Re-Analysis?

When Phase 15 queues a focused re-analysis on a sentence the student edited while list-mode was open, the affected row's state has to update (tier may change, critique may change). Does the row animate? Does the row flash? Does the row slide to a new position if the grouping or sort changes? Resolution proposal: 300ms row highlight (tier-gradient shimmer) on re-analysis arrival, no re-ordering until the student exits and re-enters list-mode (preserves scroll position).

### 9.5 Is Group-By Persisted Per-User Or Per-Session?

If a student picks Group-by-Tier in one session, does the next session open in Group-by-Tier or default to Group-by-Paragraph? Per-session is the conservative default; per-user preferred by students who have adopted a workflow. Resolution: persist per-user after the *third* use of the same non-default grouping (implicit preference learning, no explicit setting).

### 9.6 Does The Histogram Animate On Filter Changes?

When a filter chip toggles, the tier counts change (filter = `Unreviewed` reduces all tier counts to their unreviewed subsets). Does the histogram bar-widths animate, or snap? Argument for animate (perceptual continuity), argument for snap (filter is instant). Resolution: 220ms width animation, snap on reset (reset = all chips off, counts jump back to full).

### 9.7 What Triggers The Toolbar Toggle To Highlight As "Available"?

If list-mode has been opened before, the toolbar toggle is a known surface. If the student has never opened it (first session with annotations), should the toggle pulse or label itself ("new: list view")? Resolution: a single 2-step subtle pulse on the toggle at t=45s of the first session (once per user, not per essay), no label, no tooltip. Discovered on entry; not on every page-load.

### 9.8 Does Pending Re-Analysis Show A Row Spinner?

When an annotation is queued for focused re-analysis, its list row has an intermediate state — the old annotation is still there, a new one is pending. Spec currently says a `NEW` or `UPDATED` badge appears on arrival. Should the row show a tiny spinner *while* the re-analysis is in flight? Argument for: status transparency. Argument against: adds a motion element to a list that's mostly static, and the in-flight window is short (~5–12s). Resolution: no spinner; the sub-line (`2 pending re-analysis`) is the truth-telling surface.

### 9.9 On Mobile, Is The Overview Card Collapsed By Default After The First Session?

First session: overview card expanded at top. Second session: student may want to skip straight to list. Alternate: remember the last collapse state. Resolution: remember per-user (same implicit-preference rule as group-by).

### 9.10 Does List-Mode Persist When The Student Navigates Away And Returns?

If a student closes the browser tab with list-mode open and returns the next day, does the panel restore to list-mode, or default back to the Phase 5 overview card? Arguments either way. Resolution: on return, always open to the Phase 5 overview card — the calm default is the right morning-after entry point, and the toolbar toggle is one tap away. Do not persist list-mode across sessions.

### 9.11 How Does Phase 11 Interact With Phase 19's Future Report?

Once Phase 19 ships, the list-mode header's right side gets a `View full report →` link (when 12/12 reviewed). Does clicking that link navigate away from the essay editor, or open in a new tab? Resolution (pending Phase 19's own design): new tab by default, with a preference toggle for in-place.

### 9.12 Is There A Bulk "Mark All Reviewed" Action Anywhere?

A student who has actually read everything in a non-Uplift tool (e.g. read the annotations by scrolling inline without clicking) might want to mark them all reviewed at once. Current spec: no bulk action. Tension: the student's actual reading state is decoupled from the system's `reviewed_at` state. Resolution: no bulk action in v1; revisit only if the decoupling produces observable confusion (telemetry on `reviewedCount == 0 && dwell > 15min`).

### 9.13 Do The Filter Chips Support Multi-Select Across Tiers?

Current spec: `Critical only`, `Unreviewed`, `Strengths` as three discrete toggles with AND composition. Implied: to filter to "critical OR needs-work", the student has to open the `+` menu. Should there be a "Needs attention" chip that covers `Critical` + `Needs work` + `Functional`'s actionable subset? Resolution: defer until beta shows the `+` menu is being opened heavily for this composition — a single "Needs attention" chip is a good candidate for the chip-row's fourth slot in v1.1.

### 9.14 What's The A11y Story For The Minimap?

The minimap is a visual silhouette; screen reader users cannot benefit from the silhouette directly. Resolution: the minimap is `aria-hidden="true"` at the container level (it is a visual redundancy of the list, which is fully a11y-accessible). Each block is still focusable as a fallback jump-target via keyboard (Tab-reachable, enter to jump), with aria-label matching the row meta, so keyboard-only users who want a faster non-linear jump have it. Screen-reader-only users rely on the list alone.

### 9.15 Does Phase 11 Ship With A Tour?

Discoverability of the toolbar toggle is the single largest Phase 11 adoption risk. Options: (a) first-session tooltip pointing at the toggle, (b) the 2-step pulse in §9.7, (c) a full onboarding tour step. Resolution: (b) only. Tooltips are noisy, full tours are out of scope for Wave 3, the pulse is the minimum viable discoverability signal.

---

---

## 10. Closing Note

Phase 11 is the last UX phase in Wave 3 and the last phase before the product's reading experience hands off to the revision loop (Wave 4, starting at Phase 12). Every decision in this document trades on the same underlying claim: *the student opens list-mode to be oriented, not evaluated.* If Phase 11 can produce that feeling — oriented, confident, calm, in that order — every subsequent revision loop gets a running start, because the student entering revision knows what they are revising and why. If Phase 11 fails that feeling and produces its mirror (overwhelmed, judged, rushed), every subsequent phase pays for it in session-abandonment and in the exact emotional register Uplift exists to avoid. Ship the opinionated version. Measure the feeling. Iterate on the feeling, not the features.

*End of Phase 11. Wave 3 closes here.*
