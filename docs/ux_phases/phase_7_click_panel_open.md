# Phase 7: Click → Panel Open — The Core Interaction Loop

> Wave 3 / Phase 7. Depends on Phases 4–6. Feeds all downstream interaction phases (hover, edit-in-place, keyboard nav, review modes).
> Companion to `docs/INLINE_ANNOTATION_UX_PLAN.md` §5 Interaction Model, §7 Detail Panel, §9 Motion Language. Inherits Phase 5's panel geometry, Phase 6's "first loop" and Insights-tab exclusivity.

---

## 1. Design Summary

Phase 7 is the heartbeat of the whole product: the student clicks a sentence, and within ~180 milliseconds a detail panel reshapes itself around that sentence's teaching. Everything else in the system — the bloom, the hints, the filters, the coaching bar — exists to make this one gesture feel rewarding enough that the student does it fifty times in a session. The design thesis is **one gesture, one target, one response, zero ambiguity**: a click is always a commitment (no hover-previews that compete with click-opens), the panel always updates (no "already selected" dead states that punish repeated clicks), and the response is always inside the same 180ms envelope whether the panel is opening cold or swapping content. The click moment itself is a three-layer response: a **ring** on the sentence (the "I heard you" signal, 120ms fade-in, then steady), a gentle **dim** of all other annotations (the stage goes dark around the spotlight, 140ms), and a **panel reshape** (crossfade if open, slide if closed). Rapid clickers get a *latest-wins* contract with cancellation of in-flight animations and a 180ms end-to-end budget — we never queue, never stall, never lecture. Sage/Functional sentences are a *soft dead zone*: clicking still lands the student on that sentence's Profile view (so the interaction loop holds and the student learns that every sentence is "knowable"), but the Insights tab shows a one-sentence "Working as intended — no fix needed" state instead of fabricated critique. Paragraph gutter clicks open a paragraph-scope panel view (a first-class citizen, not a degraded sentence view). Deselection is Escape-only and returns the panel to the overview card; clicking the same sentence twice is an idempotent no-op that re-pulses the ring as proof-of-receipt. Scroll coordination is *asymmetric*: panel auto-scrolls its content to the relevant section; the editor only scrolls if the selected sentence would otherwise leave the viewport — and never scrolls past the reader's current reading position. On touch, the side panel becomes a bottom sheet that peaks to 55% and expands to 90% on drag, with horizontal swipe between annotations treated as a power-user gesture (not the primary nav). Everything in this phase holds to the vapor/glass aesthetic: the ring is luminous (not hard-edged), the dim is atmospheric (not gray-wash), the panel's crossfade is a soft pass-through (not a flash), and `prefers-reduced-motion` collapses the whole response to a single 140ms opacity crossfade with no motion.

---

## 2. The Ten Deep-Dive Decisions

### 2.1 The Click Moment — Ring, Cursor, Feedback Pulse

**Recommendation: a single *luminous ring* on the clicked sentence (1.5px, tier-accent color at 70% alpha, 8px blur halo), fading in over 120ms and holding for the duration of the selection, plus a 60ms `scale(1.012)` haptic-style pulse on the sentence text during mousedown→mouseup. Cursor changes to `pointer` with a subtle `::before` caret hint on hover only. No click-ripple (Material), no flash, no sound.**

The click moment is the student's *proof of causation*: "I did that." The ring is our single source of that truth. One affordance, rendered consistently, so the student never wonders "did it register?" The three-layer stack:

**Layer 1 — the ring (persistent, 120ms fade-in).**
A 1.5px inset ring hugging the sentence's decoration box (not the text baseline rectangle — ProseMirror's decoration widget outputs a span whose border-radius we match at 3px). The ring color is the tier's accent at 70% alpha, sitting on a 4px luminous halo at 20% alpha (the "glass glow"). The ring stays until the student selects another sentence, Escapes, or clicks into the editor off-annotation. It is the *spatial anchor* that tells them: this is the sentence the panel is talking about.

Why a ring and not a background fill? A fill competes with the existing underline tier color (the sentence already *has* visual language). A ring is layered above, signals selection as a distinct concept from tier, and survives all tier palettes including SAGE (which has no underline — the ring is the only visible affordance for a SAGE click, §2.6).

```css
.uplift-sentence--selected {
  box-shadow:
    inset 0 0 0 1.5px color-mix(in oklch, var(--tier-accent) 70%, transparent),
    0 0 8px 0 color-mix(in oklch, var(--tier-accent) 20%, transparent);
  border-radius: 3px;
  transition:
    box-shadow 120ms cubic-bezier(0.22, 1, 0.36, 1);
}
```

**Layer 2 — the mousedown pulse (60ms, scale 1.012).**
On `pointerdown` (not `click`), the sentence's text gets a micro-scale pulse: `scale(1)` → `scale(1.012)` → `scale(1)` over 60ms. This is below most users' threshold of conscious perception but above their proprioceptive threshold — they *feel* the click land even if they don't see it. The pulse fires on `pointerdown` so it happens at the physical gesture, not on the logical `click` event that fires on `pointerup` and is already 30–80ms late by the time the browser processes it. Using `transform: scale()` keeps it off the paint thread; the transform-origin is the sentence's center.

```css
.uplift-sentence--pressing {
  transform: scale(1.012);
  transform-origin: center;
  transition: transform 60ms cubic-bezier(0.22, 1, 0.36, 1);
}
```

**Layer 3 — the cursor.**
Sentences are `cursor: pointer`. On hover (before any click), a `::before` pseudo-element renders a 2px accent dot at the sentence's top-left corner after 180ms of steady hover — a gentle "this is clickable" hint that doesn't block the reading flow. The dot is the *pre-commitment* affordance, not a tooltip. Full hover rationale in §2.5.

**Rejected alternatives:**
- *Material ripple from click point:* kinetic, cheap-feeling, wrong tonal register for an essay editor. The ripple competes with the panel's entrance motion.
- *Background flash (150ms tier-color fill that fades out):* photo-flash feel; disrupts the glass aesthetic; students in usability sessions read it as "warning."
- *Audio click / system beep:* crosses into sensory-intrusion territory. College students write at night, in shared rooms, on headphones or no headphones; an audio beep is a net cost.
- *Hard-edged 2px solid ring:* reads as a form field focus state; too utilitarian. The luminous halo is what makes the selection feel like attention, not a text input.
- *Sentence "zoom" (scale 1.02 held while selected):* disrupts text flow and line heights in adjacent sentences — a layout tax for an aesthetic gain.

**Cursor hover change mini-spec:**

| State | Cursor | Additional hint |
|---|---|---|
| Default (over annotated sentence) | `pointer` | none |
| Hover ≥180ms (over annotated sentence) | `pointer` | accent dot at top-left corner, fades in 140ms |
| Hover over SAGE (unannotated) sentence | `pointer` | accent dot at top-left corner, dimmed to 40% alpha |
| Hover over paragraph gutter margin | `pointer` | gutter glyph intensifies from 30% to 70% alpha |
| Press (pointerdown) | `pointer` | scale pulse (60ms) |
| Selected (persistent) | `text` | ring + halo |

Once selected, the cursor returns to `text` so the student can highlight, read, or copy from inside the sentence without being told "you can still click this" — they already clicked it.

### 2.2 Panel Response — Crossfade vs Slide, Editor Width, Content Arrival

**Recommendation: if panel is already open, a 180ms content crossfade with no geometry change. If panel is closed (collapsed by student), a 250ms slide-in from right with content opacity ramping in *after* the slide reaches 80% progress. Editor width never changes mid-session — the 60/40 split is permanent once the panel has ever opened.**

The student needs to feel that the panel is *one object* that re-flows, not a different panel appearing for each sentence. That feeling is defeated if every click animates the geometry. So: move geometry only when it truly changes (closed→open), and transport content through identity-preserving crossfade when it doesn't.

**Case A: panel already open (the dominant case, >95% of clicks after the first).**

```
t=0      click lands, ring starts fading in on sentence
t=0      panel header tier label starts crossfade-out (40ms delay absorbs double-click)
t=40ms   panel content (insight card body) starts fade-out → opacity 0
t=90ms   data swapped (new annotation's content replaces old)
t=100ms  panel content fades in → opacity 1 (80ms ramp)
t=180ms  crossfade complete, new annotation fully legible
```

The 40ms delay at the start is the *coalescing window*: if the student clicks a second sentence within 40ms, we never visibly swap the first one. This is the first tier of the rapid-click contract (§2.4).

The header's tier accent bar (a 2px tinted strip at the top of the panel) *does not crossfade* — it interpolates its color via 180ms ease-in-out. This gives the panel identity continuity: same strip, different hue. It's the visual spine of the "one panel" feeling.

**Case B: panel closed (rare — student collapsed it manually, or viewing on narrow viewport that started collapsed).**

```
t=0      click lands, ring starts fading in on sentence
t=0      panel begins slide-in from right (transform: translateX(100%) → 0)
t=0      panel backdrop fades in (opacity 0 → 0.4)
t=180ms  slide 80% complete; content opacity ramp begins
t=250ms  slide complete; content opacity at 1
```

Content arriving *after* slide-80% rather than during the slide is deliberate: reading text mid-motion is a nausea trigger for motion-sensitive users and a legibility failure for everyone else. We'd rather have 70ms of empty panel than 250ms of blurred-type-sliding.

**Editor width — the 60/40 split is permanent.**
Some designs reflow the editor to 100% width when the panel is closed and back to 60% when it opens. We reject this: reflowing a text editor mid-session is a line-break trauma. Sentences that were on line 4 suddenly jump to line 3; the student's scroll position desyncs; the ring-on-selected-sentence visibly lurches. Instead:

- Before first reveal (Phases 1–3): editor is 100% width.
- At first reveal (Phase 5): editor locks to 60%, panel is 40%, permanently.
- If student collapses panel (Phase 7+): the panel slides out, but the editor holds 60% width. The right 40% becomes a soft empty space that tells them "your panel is still here, just hidden." A ghost strip at the extreme right edge (8px wide, 50% alpha) is a peek-tab they can click to re-open.

This sounds wasteful until you remember: the ghost strip is the exact same element the panel slides back into. No layout thrash. No reflow. The student's reading position is stable through *every* collapse/open cycle.

**Content appearance — skeleton or empty?**
Zero skeleton. The crossfade is fast enough (~180ms) that a skeleton screen would appear and vanish within its own animation window, creating a strobe. If data is genuinely missing (cache miss, §6), we hold the old panel content for up to 120ms while fetching; if the fetch exceeds 120ms we show an *inline spinner in the panel header tier strip* (the 2px tinted strip gets a left-to-right loading shimmer) rather than empty the content area. The body crossfade begins only when data arrives.

**Rejected alternatives:**
- *Every click triggers slide-in (even when open):* destroys the "one panel" feeling; motion-sickening on repeat.
- *Content snaps in instantly (0ms):* reads as harsh; students report "flinch" on rapid A/B tests.
- *Sliding accordion — each sentence's insight opens like a disclosure below the previous:* destroys spatial focus; buries old content; punishes rapid explorers.
- *Editor reflows to 100% on collapse:* line-break trauma, as above.
- *Panel fades fully out, then fades new content in, then fades back in (three stages):* too slow (>300ms) and feels like the system is reloading.

### 2.3 Visual Connection — Sentence ↔ Panel Linkage

**Recommendation: matching tier accent color on the panel's top edge (2px strip) + echoed sentence-text in the panel header in italic small-caps meta (*"¶3 · sentence 2 · STRONG"*), which is the one place where tier names are rendered as literal labels. No callout line, no duplicate text snippet in the header, no arrow.**

The risk of *too much* visual linkage is that it turns the panel into an explanatory placard next to the sentence. We want the panel to feel like the sentence's *voice*, not its footnote. So the linkage is minimal, elegant, and always present in exactly two places:

**Linkage 1 — the tier accent strip.**
A 2px horizontal strip across the top of the panel, color-matched to the selected sentence's tier accent. When the student's eye tracks from the selected sentence (which has the ring in the tier accent color and, except for SAGE, an underline in the same tier palette) up to the panel, the strip is their visual handrail. On sentence change, the strip *interpolates* rather than crossfades (§2.2), making it the one element of the panel that moves without blinking.

**Linkage 2 — the meta line.**
Directly below the strip, a small italic meta line:

```
¶3 · sentence 2 · STRONG
```

Typography: 12px, italic, `font-variant: small-caps`, color `oklch(0.55 0.02 280 / 0.6)` (muted). The paragraph ordinal ("¶3") is clickable — clicking it switches the panel to paragraph-scope view (§2.7). The sentence ordinal is informational. The tier name is the one place we render the tier as a full word; this is the *slow-drip color legend* (Phase 6 §2.2), and by session 2 the student has seen "STRONG" beside a green underline enough times that the mapping is internal.

**What we rejected:**

*Option A — a thin SVG callout line from the sentence's top-right corner to the panel's top-left.*
Looks elegant in mockups. Falls apart in practice: the line has to re-route on every scroll, on every sentence click, on every window resize. It crosses over editor text (legibility cost) or over the paragraph gutter (cognitive cost). At 40% viewport widths on a 1440px screen, the line is 560px long — it dominates the field of view. Users in paper prototypes called it "a tripwire."

*Option B — duplicating the sentence text as a quote in the panel header.*
Looks like a good anchor. Problem: the sentence is already visible in the editor six inches to the left; duplicating it wastes the panel's most valuable real estate (top third) on redundant content. If the student needs the sentence verbatim to compare to the rewrite suggestion, we render it inside the rewrite card where it's adjacent to the suggested revision — that's the one place duplication earns its cost.

*Option C — spatial proximity only (no color, no meta).*
Too cryptic. The panel would be right-of-sentence but could as easily be the panel for any sentence in the viewport. The tier strip + meta pair costs nothing and collapses all ambiguity.

*Option D — matching background tint on both sentence paragraph and panel.*
The Phase 5 paragraph bloom already tints paragraphs. Adding a matching panel background would double-layer the tint (since the panel is glass and would blur through to the editor) and wreck the vapor aesthetic. Reject.

**Sentence-to-panel linkage table:**

| Element | Present in sentence | Present in panel | Synchronization |
|---|---|---|---|
| Tier accent color | Underline (if not SAGE) + ring | 2px top strip | Interpolate color, 180ms |
| Tier name | Implied by underline style | Rendered in meta line | Crossfade with content |
| Paragraph ordinal | Implied by editor structure | `¶N` prefix in meta line, clickable | Instant swap |
| Sentence text | Rendered in editor | Rendered only in rewrite-card block (when applicable) | Instant swap |

### 2.4 Rapid Clicking — Cancel, Crossfade, 200ms Budget

**Recommendation: latest-click-wins with full cancellation of in-flight animations. No queue, no debounce delay beyond the 40ms coalescing window, hard ceiling of 180ms from pointerdown to panel content stable. We never "skip ahead" through a sequence of clicked sentences — we jump straight to the last one.**

Students will click rapidly. This is desired behavior, not misuse. They're scanning their essay, building a mental map, stress-testing the annotations. The system's response to rapid clicking is a trust test: if we feel sluggish, they stop clicking and we lose a primary mode of exploration.

**The rapid-click state machine:**

```ts
type ClickState =
  | { status: 'idle' }
  | { status: 'coalescing'; sentenceId: string; startedAt: number }
  | { status: 'transitioning'; sentenceId: string; abortController: AbortController }
  | { status: 'settled'; sentenceId: string };

const COALESCE_WINDOW_MS = 40;
const BUDGET_MS = 180;
```

**Timeline for the worst-case user (clicks 5 different sentences in 500ms):**

```
t=0     click sentence A → state=coalescing(A, 0)
t=20    click sentence B → state=coalescing(B, 20)   // A never rendered
t=60    coalesce elapsed; state=transitioning(B, abortCtrl_B); ring-A clears, ring-B starts, panel fade-out starts
t=100   click sentence C → abortCtrl_B.abort(); state=transitioning(C); ring-B clears mid-fade, ring-C starts; panel fade-out continues (no restart — we ride the existing opacity ramp)
t=200   click sentence D → abortCtrl_C.abort(); state=transitioning(D); same ride
t=400   click sentence E → abortCtrl_D.abort(); state=transitioning(E); ring-E starts
t=580   panel settles on E's content; ring-E is the only ring; state=settled(E)
```

**Three invariants that make this feel good:**

1. **The panel's opacity ramp is never restarted mid-fade.** If a second click arrives while the panel is fading out (opacity dropping from 1→0), we ride the existing ramp to 0, swap the data, and ride back up to 1. Restarting the ramp on every click produces a strobe. The key is that the fade-out direction doesn't depend on *which* sentence we're heading toward — it depends only on "we're swapping." So the data swap target gets updated continuously, but the animation phase carries on.

2. **Rings hot-swap instantly.** Unlike the panel, the selection ring is positional (on specific DOM node), not content (text). When sentence changes, the old ring element disappears and the new ring element appears on the new sentence — no fade-out of the old ring, no fade-in of the new ring (which would leave a brief no-ring limbo). The ring has one state: "is it on this sentence?" yes/no, instant. The halo blur softens the hard transition so it reads as luminous, not harsh.

3. **We never "play through" intermediate states.** When clicks B→C→D→E arrive in 300ms, we don't animate B→C→D→E's content through the panel. Only E's content is ever rendered. The panel opacity ramp is the only thing that ran to completion; the data it was swapping to was reassigned three times before the swap happened.

**The 180ms budget.**
From `pointerdown` to "panel content for the clicked sentence is fully opaque and stable," we target ≤180ms. This is fast enough that a rapid clicker never perceives a backlog and slow enough that content doesn't appear to flash. If the data is cached (§6), the budget is met comfortably. If it's not cached, we hold the old content visible while fetching (§6) up to 120ms beyond budget before showing the tier-strip shimmer.

**What we explicitly reject:**

- *Queuing clicks and playing each in sequence:* creates a "backed-up" feeling; punishes exploration.
- *Debouncing with 100ms window ("click hasn't changed in 100ms, now act"):* makes the first click in a sequence laggy; unnecessary given our coalescing model.
- *Locking the UI during transitions:* the student's next click always works; we never gate interactivity behind animation completion.
- *Confirmation gestures ("click again to lock in"):* a click should always commit.
- *"You clicked too fast" affordances:* condescending; students click at whatever rate they want.

**Abort contract for content fetches.**
When click N's fetch is in-flight and click N+1 lands, the fetch's `AbortController` is aborted. Aborted fetches are discarded silently (no error toast, no console warning in production). The cache (§6) still caches completed responses in case the student returns to that sentence later.

### 2.5 Click vs Hover — Boundary and Tooltip Behavior

**Recommendation: hover reveals a 2px accent dot at the sentence's top-left corner after 180ms of steady hover; a tooltip with the sentence's tier name + one-word judgment appears after 600ms; click dismisses the tooltip and commits to the panel; moving the cursor to the panel from a hovered-but-unclicked sentence does not trigger auto-click.**

Hover is a *preview* affordance; click is a *commitment* affordance. The boundary between them is legibility: the student must never be unsure whether hovering will or won't open the panel.

**The hover ladder:**

| Time hovered | Affordance | Purpose |
|---|---|---|
| 0–180ms | none | Absorbs incidental cursor travel |
| 180ms–600ms | 2px accent dot at top-left corner | "This is clickable" — clickability hint |
| 600ms+ | Tooltip: tier name + judgment | Preview without commitment |

**The tooltip.**
A small glass-pill tooltip (16px tall, 12px font, `oklch` tier accent with 85% panel backdrop-blur glass) anchored above the sentence. Contents:

```
STRONG · a moment of specificity
```

Left of the "·": the tier name in small-caps italic (same typography as the panel meta line — repeat reinforces the tier→word mapping). Right of the "·": a one-line judgment drawn from L3.5's `headline` field (capped at 32 characters, truncated with ellipsis if longer). This is the student's *preview* of the insight — just enough to decide whether to invest the click.

For SAGE sentences the tooltip reads:

```
FUNCTIONAL · working as intended
```

For CRITICAL:

```
CRITICAL · revise before submission
```

**Tooltip dismiss behavior.**

- On click: tooltip fades out in 80ms (faster than its appearance), because once the click commits, the preview is stale — the panel has the full content now.
- On cursor leaving the sentence: tooltip fades out in 120ms, with a 200ms grace period in case the cursor was just grazing (e.g., moving between adjacent words that are part of the same sentence).
- On Escape key: tooltip fades out immediately (60ms).

**The critical non-behavior: hover does not open the panel.**
This is a rule we protect fiercely. Hover-to-open panels are a well-known anti-pattern (see: Tooltip-fatigue, Fitts's law mistakes, inadvertent panel thrash on cursor travel). The panel is the primary focus instrument; opening it should always be a deliberate click.

Consequence: the student can hover across a paragraph to preview tier/judgments without ever committing. Power users scan this way. Click only when they decide to go deep.

**Cursor travel from hovered sentence to panel.**
If the student is hovering sentence A (tooltip visible), then moves the cursor toward the panel (without clicking A), the tooltip fades out when the cursor leaves A's bounding box. The panel is *not* auto-clicked. If the student wanted A's insight in the panel, they must click A — even if A's tooltip is currently visible. This preserves the click-as-commitment contract without exception.

**Screen-reader and keyboard parity.**
Hover-equivalent on keyboard is `Tab` onto a sentence (the sentence is a roving-tabindex focusable element). Focus triggers the 180ms dot and 600ms tooltip just like hover. Enter or Space commits (equivalent to click). Full keyboard spec in §5 and Phase 8.

**Rejected alternatives:**
- *No tooltip at all:* loses the preview layer; forces every exploration to be a commit.
- *Tooltip on 0-delay hover:* noisy; tooltip thrashes during cursor travel.
- *Tooltip contains the full critique:* duplicates the panel; makes the panel redundant for quick-checkers; bloats the tooltip.
- *Hover highlights the sentence with a pale tier-color wash:* conflicts with the tier underline already present.
- *Hover opens the panel after 800ms:* unacceptable — hover-to-open is the anti-pattern we must not commit.

### 2.6 Clicking Non-Annotated (SAGE / Functional) Sentences

**Recommendation: SAGE clicks are a *soft dead zone that still feels like something happened* — the ring appears on the sentence, the panel updates with the sentence's Profile tab content (L3 understanding: observedFunctions, inferredIntents, craft notes) and an Insights tab that shows the single-sentence state "This sentence is working as intended — no fix needed." The panel does NOT auto-switch tabs; it respects whatever tab the student is on.**

The temptation is to make SAGE sentences unclickable (cursor stays `text`, no ring, click does nothing). We reject this for three reasons:

1. **Silence is a bug-signal.** If the student clicks a SAGE sentence and nothing happens, their first hypothesis is "the page broke." They lose trust in all clicks until they test another. We never want any click to look like a failure.
2. **SAGE is still information.** L3's understanding of the sentence (what it does structurally, what it implies about voice) is valuable even when there's nothing to fix. The Profile tab is the right home for it.
3. **Teaching consistency.** The interaction loop is "click any sentence, learn about any sentence." SAGE carve-outs introduce a mental cost: *is this one clickable?*

**The SAGE click response:**

```
t=0      click sentence S (SAGE)
t=0      ring fades in on S (in the SAGE tier accent — muted sage green)
t=0      panel meta line updates to "¶3 · sentence 2 · FUNCTIONAL"
t=0–180  panel content crossfades as usual
t=180    panel settles. What's shown depends on current tab:
         - Insights tab (active): empty state (see copy deck §4)
         - Profile tab (active): L3 understanding content for this sentence
```

**The Insights empty state.**

```
┌─────────────────────────────────────┐
│  Working as intended                │
│                                     │
│  This sentence does its job —       │
│  no revision needed. Move on with   │
│  confidence, or switch to Profile   │
│  to see what it's doing structurally│
│  for your essay.                    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  View in Profile  →          │   │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

The CTA "View in Profile →" is an inline tab-switch (not a full click on the Profile tab header), so the student can jump to L3 content in one keystroke's worth of friction. This is the first place we cross-promote the Profile tab (Phase 6 otherwise gates Profile until after 2 Insights read; SAGE clicks are the exception — the Insight content is so thin that offering Profile is a service, not a sell).

**Why "Working as intended" and not "No feedback needed" or "Looks good":**
- "Looks good" is flattery, and we don't flatter.
- "No feedback needed" reads as system-exhaustion ("I've got nothing to say about this"), which invites the thought "maybe it's wrong and the system missed it."
- "Working as intended" is *confident*. It signals that the system considered the sentence, concluded it was serving the essay, and chose silence. Silence with confidence, not silence by omission.

**The SAGE ring color.**
The ring uses a *muted* sage tone: `oklch(0.75 0.04 150 / 0.6)` — visibly selected, but quieter than the other tier rings. This reinforces that the student is looking at a sentence that doesn't need attention without making the selection feel like a non-event.

**Profile tab content for SAGE sentences.**
The Profile tab is always populated (every sentence goes through L3). For SAGE, it's often the *richest* tab, because the sentence may be doing sophisticated structural work invisibly (a transition, a rhythm break, a pause) that the Insights tab has no reason to narrate. Structure:

```
Observed functions
  · Bridges the stakes-setup in the previous sentence to the action that follows
  · Creates a rhythmic pause (short, declarative) that foregrounds the next beat

Inferred intents
  · Control pacing
  · Let the reader "breathe" before the payoff

Craft
  · Monosyllabic word choice (8 of 10 words are 1 syllable) — accelerates scan speed
  · Colon creates expectation for the next sentence
```

(Content pulled from L3 fields `observedFunctions[]`, `inferredIntents[]`, `craft` structured object.)

**Rejected alternatives:**
- *SAGE clicks do nothing (dead zone):* breaks trust in the click contract.
- *SAGE clicks show a transient toast "No feedback on this one" and close the panel:* worst of all worlds — toast is intrusive, panel-close is a loss of state.
- *SAGE sentences render with a "click to see why it's sage" micro-cue only:* arbitrary carve-out; introduces a hover/click variant that doesn't generalize.
- *Hide the Insights tab for SAGE (only Profile tab visible):* tabs appearing and disappearing based on sentence tier would destroy the panel's sense of stable architecture.

### 2.7 Paragraph Gutter Click — Paragraph-Scope Panel View

**Recommendation: the editor's left gutter (20px strip adjacent to each paragraph, housing the paragraph-level tier tint bloom from Phase 5) is a clickable region. Click opens a *paragraph-scope* panel view — a first-class alternative to the sentence view, with its own content shape and tab set.**

Paragraphs are a unit of meaning that sentences don't capture. A paragraph can have one SAGE sentence, three STRONG sentences, and one CRITICAL sentence, and the paragraph-as-a-whole has a story the sentence-level view cannot tell: *is the argument cohesive? Does the paragraph do what the essay's narrative architecture asks of it?*

**The gutter affordance.**

On hover, the gutter region for a paragraph shows a 2px vertical strip at 70% tier-tint alpha (compared to 30% default), plus a pill-shaped glyph at the paragraph's vertical midpoint:

```
 ┌──┐
 │¶3│    <- 24px tall pill, 20px wide, tier-tint background, paragraph ordinal inside
 └──┘
```

Click the pill (or anywhere in the 20px gutter strip for that paragraph) → paragraph-scope panel view.

**The paragraph-scope panel shape.**

```
┌─── 2px tier-accent strip (paragraph-level tier, aggregate) ───┐
│                                                                │
│  ¶3 · paragraph view                                          │
│                                                                │
│  [ Insights ]  [ Architecture ]  [ Sentences ]                │
│                                                                │
│  ── Insights tab (default) ──                                 │
│                                                                │
│  Paragraph-level teaching (3–6 insights max):                 │
│                                                                │
│   1. Opening beat                                             │
│      The first sentence establishes X. Effective because...   │
│                                                                │
│   2. Stakes drift                                             │
│      Between sentences 3 and 5, the stakes... Here's why...   │
│                                                                │
│   3. Closing move                                             │
│      The last sentence lands the paragraph by...              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Three tabs unique to paragraph-scope:**

| Tab | L-layer source | Content |
|---|---|---|
| Insights | L5 paragraph-scope | 3–6 paragraph-level teaching blocks |
| Architecture | L3.75 holistic + L2 structural | How this paragraph serves the essay's arc; transition quality in/out; thematic role |
| Sentences | L3.5 roll-up | Compact list of all sentences in ¶ with their tier + one-word judgment |

**How this feels different from sentence-scope:**

1. **The ring moves to the paragraph.** The entire paragraph gets a soft left-edge glow (the 2px gutter strip deepens to 90% alpha and the gutter becomes the "ring"). Individual sentence rings inside the paragraph clear.
2. **The editor highlights nothing in particular.** No single sentence is selected; the paragraph is the unit.
3. **Clicking a sentence inside the paragraph from this state:** re-anchors to sentence-scope (ring on sentence, paragraph gutter returns to default). This is the graceful escape path.
4. **The paragraph-scope aggregate tier.** The tier accent strip uses the paragraph's aggregate tier — typically the mode of its sentences, with ties broken toward the lower tier (more-attentive wins over more-celebratory, because the paragraph's weakest link usually dominates the reader's experience of it).

**Why gutter click and not some other trigger:**

- *Click on paragraph body background (between sentences):* too easy to trigger accidentally when the student clicks in the editor to place a cursor for editing.
- *Right-click a paragraph:* hides a first-class feature in a context menu.
- *Click the paragraph's tier bloom (the existing tint):* the tint is essay-wide wallpaper; making it clickable creates ambiguity about where sentences end and paragraphs begin.
- *Dedicated "paragraph view" toggle in the panel header:* requires two clicks (select any sentence, then toggle) when one click in the gutter does it.

The gutter is the natural paragraph-affordance real estate; we claim it.

**Meta line for paragraph-scope:**

```
¶3 · 7 sentences · AGGREGATE: NEEDS WORK
```

**Returning to sentence-scope.**
Three ways:
1. Click any sentence in the editor → sentence-scope for that sentence.
2. Click the "← Back" chip in the paragraph-scope header (appears only when the panel arrived from a prior sentence-scope).
3. Escape once → returns to overview card (§2.8).

### 2.8 Deselection — Escape, Click-Outside, Click-Same

**Recommendation: Escape returns the panel to the overview card (the Phase 5 default state). Click-outside (editor background, empty paragraph space, anywhere outside an annotated sentence) does NOT deselect — clicking is a commitment gesture and requires a commitment to unmake. Click-same-sentence is a *re-pulse* idempotent (ring re-animates its 120ms fade for proof-of-receipt, panel content remains unchanged). Click-outside on the panel's backdrop (tappable empty area) IS a deselection, but only on touch.**

Deselection policy is an exercise in protecting the student's work. The worst experience is: "I selected a sentence, read the insight, clicked slightly off, and now my selection is gone and I don't know where I was." We bias toward *sticky selection*.

**Escape behavior.**

| Panel state at Escape | Behavior |
|---|---|
| Sentence-scope (any sentence selected) | Ring clears; panel crossfades to overview card; meta line clears |
| Paragraph-scope | Paragraph gutter ring clears; panel crossfades to overview card |
| Overview card (already) | No-op (soft ding-and-ignore — optional, off by default) |
| Tooltip visible (pre-click) | Tooltip dismisses; no panel change |

Escape is the *universal dismiss* — one key to unwind any active selection. The overview card is the resting state the system returns to whenever the student signals "I'm done with this particular target."

**Click-outside.**

The editor has a lot of clickable-looking space that isn't an annotated sentence: blank lines between paragraphs, the area below the last paragraph, inline whitespace. None of these deselect. Rationale:

- Accidental deselection is catastrophic (student loses their spot).
- Intentional deselection has Escape, which is instant, universal, and cheap.
- The editor background IS clickable — it places the cursor for editing text. That's a different action from deselection.

**Click-same-sentence.**

```
t=0    second click on already-selected sentence S
t=0    ring's box-shadow blur pulses from 8px → 12px → 8px over 120ms (a "breath")
t=0    no panel change, no data refetch, no analytics event beyond "re-click"
```

The re-pulse is the proof-of-receipt. It costs nothing and tells the frustrated student "yes, the system knows you clicked." This prevents the "is this even working?" rage-click escalation, because the rage-click gets visually acknowledged and the student either moves on or Escape-deselects.

**Click outside the panel's content but still inside the panel backdrop (desktop):**
No-op. The panel is a stable surface; clicking its empty regions doesn't close it.

**Click outside the panel on touch (bottom sheet):**
The area above the bottom sheet's peek line is the "backdrop" on mobile. Tapping it collapses the sheet from the expanded state back to the peek state (§2.10); tapping again from peek state collapses the sheet entirely. This is the mobile equivalent of "click outside to dismiss," scoped to touch where the panel is spatially overlaid on content.

**Selection persistence across scroll.**
The selected sentence's ring remains rendered even if the student scrolls it out of the editor viewport. This is deliberate: the selection is a state, not a visual artifact. When they scroll back, the ring is still there.

**Selection persistence across panel collapse.**
If the student collapses the panel manually (clicks the ghost strip's collapse-chevron), the ring on the sentence *persists*. The system's model of "which sentence is selected" is unchanged by panel visibility.

**Selection persistence across tab switches (Insights ↔ Profile).**
Selection persists. Switching tabs is a panel-internal action.

**Rejected alternatives:**
- *Click-outside (anywhere) deselects:* loses position on accidental clicks; aggravating.
- *Click-same-sentence closes the panel:* violates idempotence; students learn to avoid the repeat click, which erodes confidence.
- *Click-same-sentence toggles Insights↔Profile tab:* overloads the gesture; students who expect idempotence feel punished.
- *Escape closes the panel entirely:* too destructive; the overview card is a better "home" to return to.

### 2.9 Scroll Coordination — Panel Follows Content, Editor Stays Put (Mostly)

**Recommendation: asymmetric scroll coordination. Panel auto-scrolls its internal content to the relevant section when a sentence is clicked. Editor does NOT auto-scroll on click unless the selected sentence would be outside the viewport — and even then, it scrolls the minimum distance to bring the sentence to the viewport's 40% line (slight top-bias, never past where the student is currently reading).**

The editor is the student's reading surface; the panel is the teaching surface. Scroll policy respects that asymmetry.

**Panel auto-scroll.**

The panel's content may be taller than its viewport (Insights tab with 4+ sections, Profile tab with long L3 content). On click, if the panel is opening with content that has internal sections, we auto-scroll the panel to the section most relevant to the sentence. Algorithm:

```ts
function scrollPanelToRelevantSection(selectedTier: Tier, panelScrollRef: HTMLElement) {
  const targetSection = {
    CRITICAL: 'critique',
    NEEDS_WORK: 'critique',
    FUNCTIONAL: 'working-as-intended',
    STRONG: 'why-it-worked',
    EXCEPTIONAL: 'why-it-worked',
    MASTERFUL: 'why-it-worked',
  }[selectedTier];
  const sectionEl = panelScrollRef.querySelector(`[data-section="${targetSection}"]`);
  if (sectionEl) {
    sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
```

Smooth scroll duration: browser default (~300ms in most engines, which matches our "felt" motion language — we don't override).

**Editor auto-scroll — the "reader sovereignty" rule.**

| Student state | Selected sentence position | Editor scroll action |
|---|---|---|
| Reading at paragraph 4 | Sentence in ¶4, visible | No scroll |
| Reading at paragraph 4 | Sentence in ¶4, below viewport fold | Scroll sentence to 40% line (smooth, ~280ms) |
| Reading at paragraph 4 | Sentence in ¶2, above viewport | Scroll sentence to 40% line (smooth, ~280ms) |
| Reading at paragraph 4 | Sentence in ¶7, far below | Scroll sentence to 40% line — but this one we flag: see below |

**The "far scroll" friction.**
If auto-scrolling would move the viewport more than 1.5 screen-heights, we pause. The jump is disorienting. Instead: we show a small "Jump to ¶7" chip at the editor's right edge at the viewport's vertical center. Clicking the chip scrolls smoothly with a 400ms duration (slower than usual, to let the eye track the jump). Not clicking the chip is fine — the sentence's ring is rendered at the panel-side anyway (visible via the panel's meta line), and the student can scroll manually.

This comes from paper prototypes where students clicking "Next critical sentence" from a filter-list found themselves yanked 8 screen-heights away with no sense of where they were. Giving them the jump chip preserves agency.

**Why 40% line and not 50% (center)?**
The natural reading eye rests slightly above center — the convention from Medium, Notion, VS Code. Centering puts the sentence in the "already-read" half of the screen, which is jarring. 40% gives the student a clear "you are here" feeling with the sentence in the attention zone plus visible context below.

**Scroll coordination with the paragraph gutter.**
When paragraph-scope opens (§2.7), the editor scrolls to bring the *paragraph's first sentence* to the 40% line, not the paragraph's center. Rationale: the student reads top-down, and the first sentence is the thematic anchor.

**"Keep selected sentence visible" during manual panel interaction.**
If the student is scrolling the panel's content (reading a long L5 insight), we never adjust the editor. The panel is in focus; the editor can be wherever it is.

**"Keep selected sentence visible" during manual editor scroll.**
If the student scrolls the editor away from the selected sentence, the ring stays on the sentence (which is off-screen). We do NOT redrag the editor back. Scrolling is the student's prerogative.

**Rejected alternatives:**
- *Editor always centers the selected sentence:* too yanky; 50% line is wrong.
- *Editor never scrolls, even if sentence is off-screen:* the student loses visual connection between sentence and panel.
- *Pan-and-zoom metaphor (like Figma selection):* overkill for text.
- *Synchronize panel scroll to editor scroll (bidirectional):* panel content doesn't have a 1:1 spatial mapping to editor content; bidirectional sync is a rabbit hole.

### 2.10 Touch Interactions — Bottom Sheet, Tap, Long-Press, Swipe

**Recommendation: on touch viewports (≤1024px width OR touch-primary input detected), the right-panel is replaced by a bottom sheet that peaks at 55% viewport height, expands to 90% on drag, and collapses entirely on drag-down past 30%. Tap is the click primitive; long-press (500ms) shows the tooltip (replacing hover); horizontal swipe between sentences is available as a power-user gesture but not the primary nav.**

Touch is not "desktop with fingers." The geometry, the gestures, and the eye-hand coordination are different.

**Layout transform.**

| Surface | Desktop (≥1025px) | Tablet (769–1024px) | Phone (≤768px) |
|---|---|---|---|
| Editor | 60% left | 100% width, panel overlays | 100% width, sheet overlays |
| Panel | 40% right, permanent | Overlay drawer from right, 85% width | Bottom sheet, peek 55% / expand 90% |
| Gutter | 20px left of editor | 24px (larger touch target) | 28px (larger touch target) |

The tablet case is a hybrid: the panel is an overlay drawer (like mobile) but comes from the right (like desktop). Phones commit to the bottom sheet because thumb ergonomics favor bottom-of-screen affordances.

**Tap primitive.**

On touch, `click` and `tap` are the same event at the library level. The 60ms press pulse (§2.1) fires on `pointerdown` which fires on touchstart — same visual response. The 300ms "ghost click" delay from legacy touchevents is moot on modern devices; we use `touch-action: manipulation` to opt out explicitly.

**Long-press replaces hover.**

```
t=0     pointerdown on sentence
t=0     press pulse (60ms scale) fires immediately
t=500   if pointer still down and hasn't moved >4px, long-press triggers
t=500   tooltip fades in (same tooltip as desktop hover, §2.5)
t=500+  if pointer moves >4px, long-press is cancelled (treated as attempted scroll)
t=release if long-press fired, release does NOT commit the click
```

The long-press → tooltip pathway lets touch students preview insights without committing. A *tap* (shorter than 500ms + no movement) commits to the panel. A *long-press* previews and releases without committing.

**Bottom sheet mechanics.**

```
         ┌─────────────────────────┐
         │                         │
         │   Editor (full width)   │
         │                         │
         │   ─ ─ ─ ─ ─ ─ ─ ─ ─    │  <- 45% from top = peek line
         │                         │
╔════════╪═════════════════════════╪═══════╗
║  ═══                              (drag) ║  <- 6px grab handle
║                                          ║
║   ¶3 · sentence 2 · STRONG              ║
║                                          ║
║   Insight title                          ║
║   ...                                     ║
║                                          ║
║                                          ║
╚══════════════════════════════════════════╝
```

- **Peek state (default on touch):** sheet occupies bottom 55% of viewport. The top ~45% shows editor with the selected sentence's ring visible.
- **Expanded state (on drag up):** sheet occupies 90%. Editor barely visible (10% top strip). Useful for reading long insights.
- **Collapsed state (on drag down below 30%):** sheet fully dismissed. Editor full-height. Selection ring persists on sentence.

Drag uses a `framer-motion` / `motion/react` `<motion.div>` with `drag="y"`, `dragConstraints={{ top: -maxExpand, bottom: 0 }}`, and a spring `{ type: 'spring', stiffness: 400, damping: 35 }`. Snap points at 55% and 90% via `dragSnapToOrigin` + custom onDragEnd handler.

**Horizontal swipe between annotations.**

```
Swipe left on sheet  → next annotated sentence (in reading order)
Swipe right on sheet → previous annotated sentence
```

This is a *power-user* gesture. We do not advertise it in Phase 6's hints (budget is tight). If the student discovers it, great. If they don't, the primary nav (tapping sentences in the editor) still works.

Swipe threshold: 80px horizontal movement OR 30% of sheet width, whichever is smaller. Velocity tolerance: swipes faster than 400 px/sec commit at half the distance threshold.

**Filter tier: "annotated sentences" vs "all."**
By default, swipe cycles only through annotated sentences with tier ≠ FUNCTIONAL (i.e., sentences that have something to teach). If the student has explicitly toggled a tier filter in the toolbar, swipe respects that filter.

**Sheet header always shows the meta line.**
Even at peek state, the sheet's top 40px (above the content scroll) shows the meta line and a chevron for expand/collapse. The student always knows which sentence's insight they're looking at.

**Rejected alternatives:**
- *Full-screen modal panel:* destroys the "essay is visible" context; collapse takes the student out of the flow.
- *Side drawer on phone (coming from right, 85% width):* leaves a too-narrow editor strip that's unreadable; landscape orientation is rare for essay reading.
- *Always-expanded bottom sheet (no peek):* dominates the viewport; no way to glance at the essay mid-read.
- *Swipe as primary nav (no tap on sentences):* students who don't know the gesture are lost; discoverability failure.

---

## 3. Motion Spec — Timeline and Easing

### 3.1 The canonical click sequence (panel already open)

```
t=0          pointerdown on annotated sentence
t=0          sentence: scale(1) → scale(1.012)  [60ms, cubic-bezier(0.22, 1, 0.36, 1)]
t=0          ring-old: box-shadow fades out (if a previous selection) [instant — hot swap]
t=0          ring-new: box-shadow fades in on clicked sentence [120ms, cubic-bezier(0.22, 1, 0.36, 1)]
t=0          panel header tier-accent strip: color interpolates from old tier to new tier [180ms, ease-in-out]
t=40         [coalesce window closes — if user clicks again within 40ms, restart at this point with new target]
t=40         panel meta line: opacity 1 → 0 [50ms, linear]
t=40         panel content body: opacity 1 → 0 [50ms, linear]
t=60         sentence: scale(1.012) → scale(1) [press pulse releases]
t=90         panel meta line: data swapped; rendered invisible
t=90         panel content body: data swapped; rendered invisible
t=100        panel meta line: opacity 0 → 1 [80ms, ease-out]
t=100        panel content body: opacity 0 → 1 [80ms, ease-out]
t=120        ring: full opacity (120ms fade complete)
t=180        panel content body: opacity 1 (content fully legible)
t=180        panel meta line: opacity 1
t=180        panel tier-accent strip: color settled on new tier
t=180        SETTLED — click response complete
```

### 3.2 Panel-opens-cold variant (panel was collapsed)

```
t=0          pointerdown on annotated sentence
t=0          sentence: scale pulse [60ms]
t=0          ring-new: fade-in [120ms]
t=0          panel: translateX(100%) → translateX(0) [250ms, cubic-bezier(0.16, 1, 0.3, 1)]
t=0          backdrop-blur: opacity 0 → 0.4 [200ms, ease-out]
t=60         press pulse releases
t=120        ring at full opacity
t=180        panel at ~80% slide progress; content opacity 0 → 1 begins [70ms, ease-out]
t=250        panel slide complete; content at opacity 1
t=250        SETTLED
```

### 3.3 Rapid-click override (second click arrives at t=80)

```
t=0          click 1 on sentence A → canonical sequence starts
t=80         click 2 on sentence B
t=80         abortCtrl_1.abort()
t=80         ring-A: box-shadow removed (hot swap)
t=80         ring-B: fade-in starts [120ms]
t=80         panel header strip: color interpolation retargeted from "A's tier" to "B's tier" (continues from current interpolated value — no restart)
t=80         panel content fade-out continues from current opacity (no restart)
t=90         data swap: meta and body retargeted to B
t=140        panel content fade-out complete; data is B's data
t=150        panel content fade-in starts
t=200        ring-B at full opacity
t=230        panel content at opacity 1
t=230        SETTLED (on B, not A — A was never rendered)
```

### 3.4 SAGE click sequence

Identical to canonical (§3.1). The only difference is the ring color and the content shape in the panel (Insights tab shows empty state; Profile tab shows L3 content). No special motion.

### 3.5 Paragraph gutter click

```
t=0          click paragraph gutter pill (¶N)
t=0          previous sentence ring fades out [120ms]
t=0          gutter 2px strip for paragraph: alpha 0.3 → 0.9 [180ms, ease-out]
t=0          panel header strip: interpolates to aggregate paragraph tier [180ms]
t=40         panel content fade-out starts
t=90         data swap to paragraph-scope content
t=100        panel content fade-in starts
t=180        SETTLED in paragraph-scope view
```

### 3.6 Deselection (Escape) sequence

```
t=0          Escape pressed
t=0          ring fades out [120ms, cubic-bezier(0.22, 1, 0.36, 1)]
t=0          panel meta line: opacity 1 → 0 [50ms]
t=0          panel content body: opacity 1 → 0 [50ms]
t=0          panel tier-accent strip: color interpolates to overview-card neutral tone [180ms]
t=50         panel data swap to overview card
t=50         panel content fade-in [80ms]
t=120        ring fully cleared
t=130        panel content fully legible (overview card)
t=180        SETTLED (overview state)
```

### 3.7 Click-same-sentence re-pulse

```
t=0          click on already-selected sentence
t=0          ring blur expands: 8px → 12px [60ms, ease-out]
t=60         ring blur contracts: 12px → 8px [60ms, ease-in]
t=120        SETTLED (no other changes)
```

### 3.8 Easing curve registry

| Name | Cubic-bezier | Used for |
|---|---|---|
| `motion-in` | `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quart) | Rings, press pulses, content fade-ins |
| `motion-out` | `cubic-bezier(0.4, 0, 0.2, 1)` (Material standard) | Content fade-outs (shorter, less dwell at end) |
| `panel-slide` | `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo) | Panel slide-in from right |
| `tier-interpolate` | `cubic-bezier(0.4, 0, 0.2, 1)` | Tier accent strip color interpolation |
| `linear` | `linear` | Opacity fades that need to feel mechanical (data-swap moments) |

### 3.9 `prefers-reduced-motion` collapse

When `@media (prefers-reduced-motion: reduce)` is matched, the entire Phase 7 motion language collapses to a single contract:

- **No sliding.** Panel appears in place via opacity fade (140ms).
- **No scaling.** Press pulse is replaced by a brief box-shadow flicker (80ms) with no transform.
- **No interpolation on the tier-accent strip.** Strip color swaps instantly.
- **Content crossfade is a 140ms opacity-only transition.**
- **Rings fade in at 140ms (slightly slower than default) but do not pulse.**
- **Scroll remains smooth-scroll** (reduced motion does not mean teleport — `scrollIntoView({behavior: 'auto'})` is jarring; we keep smooth but browsers respect the pref at their level).

```css
@media (prefers-reduced-motion: reduce) {
  .uplift-sentence,
  .uplift-sentence--pressing,
  .uplift-sentence--selected {
    transition: box-shadow 140ms ease, opacity 140ms ease !important;
    transform: none !important;
  }
  .uplift-panel,
  .uplift-panel--sliding {
    transition: opacity 140ms ease !important;
    transform: none !important;
  }
  .uplift-panel__tier-strip {
    transition: none !important;
  }
}
```

### 3.10 `motion/react` component sketches

```tsx
import { motion, AnimatePresence } from 'motion/react';

// Ring on selected sentence (rendered as a decoration widget overlay)
function SelectionRing({ tier }: { tier: Tier }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  return (
    <motion.span
      className="uplift-ring"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0.14 : 0.12,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{
        boxShadow: `inset 0 0 0 1.5px var(--tier-${tier}-accent),
                    0 0 8px 0 var(--tier-${tier}-halo)`,
      }}
    />
  );
}

// Panel content crossfade
function PanelContent({ annotationId, children }: { annotationId: string; children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={annotationId}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          opacity: { duration: 0.08, ease: 'easeOut' },
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Panel slide-in
function Panel({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{
            duration: 0.25,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="uplift-panel"
        >
          {children}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
```

---

## 4. Copy Deck

### 4.1 Panel headers

| Scope | Header format | Example |
|---|---|---|
| Overview card | `Your essay at a glance` | (static) |
| Sentence-scope | `¶{N} · sentence {M} · {TIER}` | `¶3 · sentence 2 · STRONG` |
| Paragraph-scope | `¶{N} · {count} sentences · AGGREGATE: {TIER}` | `¶3 · 7 sentences · AGGREGATE: NEEDS WORK` |

### 4.2 Insights tab empty states

**SAGE / FUNCTIONAL sentence:**
```
Working as intended

This sentence does its job — no revision needed.
Move on with confidence, or switch to Profile
to see what it's doing structurally for your essay.

  [ View in Profile → ]
```

**No L5 data available (fetch failure):**
```
We're still generating this one

Hang on — your insight for this sentence is on the
way. If this message sticks for more than a few seconds,
try clicking away and back.

  [ Retry ]
```

**L5 data empty (should not happen in production, but reserved):**
```
Nothing to add here

The system read this sentence and didn't have anything
worth teaching. That's a good sign — keep going.
```

### 4.3 Tooltips (hover / long-press)

Format: `{TIER} · {headline}`, max 48 chars combined.

| Tier | Headline source | Example |
|---|---|---|
| CRITICAL | `l3_5.headline` | `CRITICAL · revise the metaphor` |
| NEEDS WORK | `l3_5.headline` | `NEEDS WORK · specify the stakes` |
| FUNCTIONAL | (static) | `FUNCTIONAL · working as intended` |
| STRONG | `l3_5.headline` | `STRONG · vivid and grounded` |
| EXCEPTIONAL | `l3_5.headline` | `EXCEPTIONAL · lands with weight` |
| MASTERFUL | `l3_5.headline` | `MASTERFUL · perfectly calibrated` |

If `l3_5.headline` is longer than 32 chars, truncate at 29 + ellipsis.

### 4.4 Chips and buttons

| Chip | Copy | Placement |
|---|---|---|
| Start here (Phase 5 carryover) | `Start here` | Panel bottom-right |
| Jump to paragraph (far scroll) | `Jump to ¶{N}` | Editor right edge, viewport vertical center |
| Back from paragraph-scope | `← Back to sentence` | Paragraph-scope header |
| View in Profile (SAGE empty) | `View in Profile →` | Inside Insights empty state |
| Re-open panel (after collapse) | (no text — icon only, chevron-left) | Editor right edge, ghost strip |

### 4.5 Meta line tier names (the one place we render full words)

| Tier | Rendered as |
|---|---|
| <40 | `CRITICAL` |
| 40–54 | `NEEDS WORK` |
| 55–75 | `FUNCTIONAL` |
| 76–85 | `STRONG` |
| 86–95 | `EXCEPTIONAL` |
| 96–100 | `MASTERFUL` |

Typography: 12px, small-caps italic, muted (`oklch(0.55 0.02 280 / 0.6)`).

### 4.6 Screen-reader announcements

On selection change (polite live region):

```
"Sentence 2 of paragraph 3 selected. Tier: Strong.
 Headline: vivid and grounded.
 Press Enter to read the full insight, or Tab to navigate."
```

On paragraph-scope entry:

```
"Paragraph 3 selected. Contains 7 sentences.
 Aggregate tier: Needs Work.
 Press Enter to read paragraph-level insights."
```

On Escape (deselection):

```
"Selection cleared. Panel returned to essay overview."
```

On SAGE click (Insights tab):

```
"Sentence 2 of paragraph 3 selected. Tier: Functional.
 This sentence is working as intended. No revision needed.
 Press P to switch to Profile tab for structural detail."
```

### 4.7 Toast / ephemeral messages — banned

We do not surface any of the following as toasts in Phase 7:
- "Click registered" (the ring IS the confirmation)
- "Loading insight..." (the tier-strip shimmer IS the loading state)
- "No annotations on this sentence" (the SAGE empty state IS the message)
- "Selection cleared" (the overview card IS the feedback)

---

## 5. Mobile Adaptation

### 5.1 Viewport breakpoints

| Width | Device class | Panel treatment |
|---|---|---|
| ≥1280px | Desktop large | 60/40 split, permanent |
| 1025–1279px | Desktop small / laptop | 60/40 split, permanent |
| 769–1024px | Tablet landscape / large tablet | Right-side overlay drawer, 85% width |
| 481–768px | Tablet portrait / phone landscape | Bottom sheet, peek 55% / expand 90% |
| ≤480px | Phone portrait | Bottom sheet, peek 60% / expand 92% |

Input detection: `(pointer: coarse)` CSS media query plus explicit touch event listening. If a device reports both coarse and fine pointers (Surface, iPad with trackpad), we respect explicit user preference if stored, else default to the width-based treatment.

### 5.2 Bottom sheet specification

**Visual anatomy:**
- 6px gray grab handle, 36px wide, centered at top, 40% alpha.
- 2px tier-accent strip below grab handle.
- Sticky meta line below tier strip (always visible, even during content scroll).
- Scrollable content region (Insights / Profile tabs).
- Safe-area-inset-bottom padding for devices with home indicators.

**Drag states:**

```ts
type SheetState = 'collapsed' | 'peek' | 'expanded';

const SNAP_POINTS = {
  collapsed: 0,        // off-screen
  peek: 0.55,          // 55% viewport
  expanded: 0.9,       // 90% viewport
};

const SNAP_THRESHOLDS = {
  // Where the sheet's top is at release time determines snap
  closeThreshold: 0.25,    // below this → collapse
  expandThreshold: 0.72,   // above this → expand
  // Else → peek (default)
};
```

**Velocity override.**
A fast drag in either direction snaps two steps at once: from expanded, a fast drag-down goes straight to collapsed (skipping peek) if release velocity > 800 px/sec.

**Backdrop.**
When the sheet is in `peek` or `expanded`, a translucent backdrop (20% black, 8px backdrop-blur) covers the portion of the editor above the sheet. Tapping the backdrop drops one snap level (expanded → peek, peek → collapsed).

### 5.3 Gutter touch targets

The paragraph gutter on phone is 28px wide (vs 20px desktop) to accommodate thumb taps. The paragraph pill glyph (¶N) is 32×24px with 8px of surrounding tap-target padding (effective 48×40px hit area). This meets WCAG 2.5.5 Level AAA (44×44px).

### 5.4 Sentence touch targets

Sentences in text are inherently variable in height. We pad the clickable area vertically: each sentence decoration has 4px of vertical hit padding on top and bottom, giving short sentences (one line) a 24–28px tap target. This uses `pointer-events: auto` on the decoration and `pointer-events: none` on adjacent whitespace, so we don't intercept inter-sentence taps.

### 5.5 Long-press & haptic

On supported devices (`navigator.vibrate`), the 500ms long-press trigger fires a 10ms haptic pulse to confirm tooltip arrival. This is the only haptic in Phase 7. No haptic on tap (would be noisy at scan-rate clicking) or on snap (OS already handles sheet haptic via iOS pointer drag on most systems).

### 5.6 Swipe-between-annotations

Horizontal swipe within the sheet (not on the editor — editor swipe is reserved for text selection) navigates to the next/previous annotated sentence in reading order, skipping FUNCTIONAL.

```ts
function nextAnnotatedSentence(
  currentId: string,
  annotations: Annotation[],
  includeFunctional = false
): Annotation | null {
  const sorted = annotations.sort(byDocumentOrder);
  const currentIdx = sorted.findIndex(a => a.id === currentId);
  for (let i = currentIdx + 1; i < sorted.length; i++) {
    if (includeFunctional || sorted[i].tier !== 'FUNCTIONAL') return sorted[i];
  }
  return null;
}
```

The sheet's content crossfades on swipe commit; the editor's selected-sentence ring moves to the new sentence, and the editor auto-scrolls per §2.9 rules.

### 5.7 Keyboard-on-mobile

External keyboard support (iPad with Magic Keyboard, Surface with Type Cover): all desktop shortcuts work (Arrow keys, Tab, Enter, Escape). The bottom sheet treatment is unchanged — the presence of a keyboard doesn't reshape the layout, since the student may remove the keyboard mid-session.

### 5.8 Orientation changes

On orientation change (portrait ↔ landscape), the sheet state is preserved. A phone in landscape with a bottom sheet at 90% expanded is unusual but supported — the sheet reflows its content without snapping.

---

## 6. Backend Requirements

### 6.1 The click contract (client → server → client)

The click event is *optimistically rendered* — the ring and panel fade begin before any server round-trip. Data for the insight card should arrive within 180ms of the click to meet the budget. This is achievable because:

1. **All annotation data is prefetched.** When the essay is first analyzed (Phases 1–4), all L3, L3.5, L3.75, L5 outputs for every sentence are bundled into a single `AnalysisBundle` payload and shipped to the client. Subsequent clicks are resolved from client-side cache (no network call).
2. **If prefetch is incomplete** (e.g., incremental update mid-session where L5 has regenerated for some sentences but not others), the client holds the old panel content for up to 120ms beyond the standard budget while fetching; the tier-strip shows a loading shimmer if we exceed 120ms.

### 6.2 Shape of the prefetched `AnalysisBundle`

```ts
interface AnalysisBundle {
  essayId: string;
  version: number;              // incremented on any regen
  l1: Map<SentenceId, L1Descriptive>;
  l2: L2Structural;             // essay-level, not per-sentence
  l2_5: L25ConnectionScout;     // essay-level
  l3: Map<SentenceId, L3Understanding>;
  l3_5: Map<SentenceId, L35Analysis>;
  l3_75: L375HolisticSynthesis;  // essay-level
  l5: Map<SentenceId, L5Feedback>;
  paragraphScope: Map<ParagraphId, {
    aggregateTier: Tier;
    l5Paragraph: L5ParagraphFeedback;
    architecture: L375ArchitectureExcerpt;
  }>;
  overviewCard: OverviewCardContent;
}
```

### 6.3 Sentence-level L5 shape (what the Insights tab renders)

```ts
interface L5Feedback {
  sentenceId: SentenceId;
  tier: Tier;
  headline: string;             // ≤32 chars, used in tooltip
  critique: string;             // 1–3 sentences on what's happening
  whyItMatters: string;         // 1–2 sentences on impact on reader
  rewriteSuggestion?: {
    original: string;           // verbatim sentence
    revised: string;            // suggested rewrite
    rationale: string;          // 1 sentence on what the revision does
  };
  // SAGE/FUNCTIONAL: critique and whyItMatters are null; headline is static "working as intended"
}
```

### 6.4 Sentence-level L3 shape (what the Profile tab renders)

```ts
interface L3Understanding {
  sentenceId: SentenceId;
  observedFunctions: string[];  // 1–4 items: what the sentence does in the essay
  inferredIntents: string[];    // 1–3 items: what the student seems to want from it
  craft: {
    syntax: string;             // e.g., "Short declarative; colon creates suspension"
    diction: string;            // e.g., "Monosyllabic; Anglo-Saxon weight"
    rhythm: string;             // e.g., "2-beat then 5-beat — accelerates"
    imagery?: string;
  };
}
```

### 6.5 Client-side cache

All sentence-level and paragraph-level data lives in an in-memory `Map` keyed by `SentenceId` or `ParagraphId`. The cache has an `essayVersion` field; when a regen completes with a new version, the cache is invalidated and reloaded in full. We do not partially invalidate the cache per-sentence (even for Focused Analysis Mode updates) — the bundle ships as a unit.

Cache warming happens during Phase 4 (loading); by the time the student reaches Phase 6 and starts clicking, all cache entries are populated.

### 6.6 Network calls actually triggered by clicks

| Action | Network? | Why |
|---|---|---|
| Click sentence → panel updates | No | Cache hit |
| Click paragraph gutter | No | Cache hit (paragraphScope map) |
| Escape → overview card | No | Overview cached |
| Switch Insights ↔ Profile tab | No | Both cached |
| Rewrite acceptance (future) | Yes | Separate flow — Phase 9 |
| L6 conversation follow-up (future) | Yes | Separate flow — Phase 10 |

This is the critical architectural commitment: **Phase 7's core interaction loop is a zero-network experience after initial load.** Latency is bounded by client compute + animation, never by network. This is what buys us the 180ms budget reliably.

### 6.7 Telemetry events (non-blocking)

Fire-and-forget analytics:

```ts
track('annotation_clicked', {
  essayId,
  sentenceId,
  tier,
  paragraphId,
  timeFromBloomEndMs: number,   // helps calibrate Phase 6
  panelStateBeforeClick: 'open' | 'closed' | 'overview',
  previousSelection: SentenceId | null,
  clickMethod: 'mouse' | 'touch' | 'keyboard',
});

track('annotation_deselected', {
  essayId,
  sentenceId,
  method: 'escape' | 'same-sentence-click' | 'other',  // other is reserved
  dwellMs: number,              // time from select to deselect
});

track('paragraph_clicked', {
  essayId,
  paragraphId,
  aggregateTier,
  arrivedFrom: 'sentence' | 'overview',
});
```

Telemetry MUST NOT block UI. Use `requestIdleCallback` or `navigator.sendBeacon` with best-effort delivery.

### 6.8 Abort semantics for in-flight fetches

Although most clicks are cache hits, some scenarios (incremental regen, cold-load) involve fetches. Every fetch tied to a click is gated by an `AbortController` whose lifetime is the lifetime of that click's commitment. If a new click arrives, the previous click's controller is aborted. Aborted fetches are not logged as errors.

```ts
let activeClickCtrl: AbortController | null = null;

async function onSentenceClick(sentenceId: SentenceId) {
  activeClickCtrl?.abort();
  activeClickCtrl = new AbortController();
  const data = await fetchInsight(sentenceId, { signal: activeClickCtrl.signal });
  renderPanel(data);
}
```

### 6.9 Data freshness contract

The `AnalysisBundle.version` field guards against rendering stale insights after a regen. When the client detects a version mismatch (e.g., the essay was edited in another tab, triggering a regen), the panel shows a quick "essay updated — refreshing" banner and fetches the new bundle in the background. This is a rare Phase 7 occurrence (single-tab editing is dominant) but specified here for completeness.

---

## 7. Emotional Map — 0ms → 200ms → 2s

The product serves 16–18-year-olds receiving granular essay feedback, often for the first time. Every millisecond of the click response either reinforces or undermines the trust we built in Phases 4–6. The map below traces what the student *feels* at each moment of the canonical click.

### 7.1 At t=0ms (pointerdown)

**Cognitive state:** commitment. They've chosen this sentence. They're braced for feedback, which is partly fear ("will this say I'm bad?") and partly anticipation ("I want to know how to fix it" / "I want to know why it worked").

**What the UI does:**
- 60ms press pulse on the sentence.
- Ring starts fading in.

**What they feel:**
A tiny mechanical confirmation — the essay pushed back on their click the way a real button does. The commitment is real.

**What they do NOT feel yet:**
Relief, insight, encouragement. Those come later. At t=0ms they only feel *heard*.

### 7.2 At t=60ms (press pulse released)

**Cognitive state:** waiting.

**What the UI does:**
- Ring is at ~50% opacity.
- Panel content has begun its fade-out.
- Tier-accent strip is mid-interpolation.

**What they feel:**
"Something is changing." The system is in motion. This is the phase where sluggishness kills — if we're still at t=60ms with nothing visible happening, the student starts to tap again or wonder if they missed. The press pulse saves us by being visible within the first frame.

### 7.3 At t=120ms (ring fully visible)

**Cognitive state:** landing.

**What the UI does:**
- Ring is at 100% opacity, sentence is visibly the subject of attention.
- Panel content is mostly invisible (opacity ~0.2, on its way back up).

**What they feel:**
"My click worked. The panel is about to tell me something." This is the critical moment where the *spatial* confirmation (ring) precedes the *content* confirmation (panel). Ring-first buys us 60ms of cognitive preparation time.

### 7.4 At t=180ms (panel content stable)

**Cognitive state:** receiving.

**What the UI does:**
- Panel shows the new insight at full opacity.
- Ring stable.
- Tier-accent strip settled in new tier color.

**What they feel:**
The three possible emotions, by tier:

| Tier | Primary emotion | What the panel says |
|---|---|---|
| CRITICAL | Tension + focus | "Here's what's going wrong and how to fix it." |
| NEEDS WORK | Minor alertness | "Here's a direction to tighten." |
| FUNCTIONAL | Mild surprise + relief | "Working as intended." |
| STRONG | Warm validation | "Here's why this worked." |
| EXCEPTIONAL | Delight | "Here's the specific craft move you pulled off." |
| MASTERFUL | Awe ("did I do that?") | "This is sharper than most published essays." |

The goal at t=180ms is to deliver the emotion *cleanly*. If we fumble the motion (strobe, flash, stall), the emotion's edge is blunted. The student's relationship with their essay — with themselves as a writer — is hanging on the clarity of this moment.

### 7.5 At t=200–500ms (reading begins)

**Cognitive state:** comprehension.

**What the UI does:**
Nothing. The panel is stable. The editor is stable. The ring is stable.

**What they feel:**
Control. They can read, re-read, hover, scroll the panel, switch tabs. The system has done its job and receded. This is the vapor/glass aesthetic earning its name: the chrome recedes so the content can breathe.

### 7.6 At t=1–2s (decision point)

**Cognitive state:** metabolizing.

By now, the student has read the critique (or the why-it-worked) and is deciding what to do. Possibilities:
- Click the next sentence (continue exploring).
- Switch tabs to see structural understanding (Profile).
- Begin editing in-place (Phase 8).
- Click "Jump to ¶N" to go to the next critical sentence (if filter is active).
- Escape to overview (take a breath).

**What they feel:**
Agency. The system has handed back control with a clear menu of possibilities. Our job at t=2s is to be *silent enough* that the student hears themselves think.

### 7.7 The failure modes we guard against

| Failure mode | Emotional consequence | Guard |
|---|---|---|
| Click registers late (>300ms no ring) | Doubt → rage-click | Press pulse at t=0, ring at t=120 |
| Panel strobes on rapid click | Overwhelm → abandonment | Coalesce + abort-in-place |
| Content flashes stale then swaps | Confusion → mistrust | Fade-out before data swap |
| SAGE click does nothing | "Is this broken?" | SAGE click lands with full response |
| Editor reflows on panel close | "Where's my spot?" | Editor width is permanent |
| Selection lost on click-outside | Frustration | Escape-only deselection |
| Autoscrolling yanks them far | Disorientation | "Jump to ¶N" chip for far scrolls |
| Deselection takes them back to empty | Cliff feeling | Escape returns to overview (home) |
| Panel ignores touch | "App is broken" | Bottom sheet treatment on coarse pointer |

### 7.8 The meta-emotion: custody

The student has *entrusted their essay* to this system. Every interaction is a custody event — are we treating the work with the care a real reader would? The ring says "I'm paying attention to this specific sentence." The tier-strip says "I know what tier this is." The meta line says "I know its place in your essay." The SAGE-click "working as intended" says "I'm not going to invent feedback to seem smart." The stickiness of selection says "I won't let you lose your place."

Phase 7 is where custody is performed, not claimed. Every decision above serves that performance.

---

## 8. Open Questions for Wave 4

The following are deliberately deferred — Phase 7 establishes the core loop; these evolve it.

### 8.1 Edit-in-place from the panel

When the student reads a rewrite suggestion, should they be able to accept it with a click (panel button → editor swaps sentence, ring flashes confirm)? Or should accept-rewrite be a modal-level "diff view" (panel shows old/new side-by-side, student chooses)? Tradeoff: speed (one-click accept) vs control (diff review). Wave 4 should test both with students in moderated sessions.

### 8.2 Multi-sentence selection

Students occasionally want to select a sentence *and* the one before it (for context) or a range (paragraph-minus-one). Does the panel support a compound selection — e.g., "sentences 2–4"? Shape implication: the L5 layer currently outputs per-sentence teaching; compound would require either aggregation (server-side) or a new client-side "compound view" mode. Defer to Wave 4 after observing how often students want this.

### 8.3 Commenting and AI-follow-up-question from the panel

Phase 7 establishes the read-only insight. Wave 4 adds *response* — the student types a follow-up ("I don't want to change this, is there another way to read it?") and L6 conversation mode takes over. The question: does the follow-up arrive in the same panel (tab switch? appended card?) or in a dedicated surface? Tradeoff: context preservation vs surface focus.

### 8.4 Cross-session state

Should the selected sentence persist across sessions (student closes the laptop, returns tomorrow, same sentence is still selected)? Or does session start always return to overview? Argument for persist: the student's cognitive thread is continuous across sessions. Argument for reset: dayspan is long enough that re-orientation is cheap and selection may be stale. Decision deferred; defaults to reset in MVP.

### 8.5 Zoom and focus mode

Pro-mode: a "focus on this sentence" command that dims everything in the editor except the selected sentence (and panel shows only this insight, full-screen). Would this help students in deep-revision mode, or is it over-engineering? Defer to analytics: if we see 20%+ of sessions with >10 clicks on the same sentence's insight, build it.

### 8.6 Undo / revision history

When the student accepts a rewrite (Phase 9 territory), does the panel offer an "undo"? For how long? Keyboard shortcut (Cmd+Z) or UI affordance? This interacts with the editor's own undo stack (TipTap/ProseMirror has one); need to decide whether "accept rewrite" is a single atomic undo step or decomposes into multiple.

### 8.7 Collaborative / shared views

If two students (or a student and a counselor) view the same essay simultaneously, does the panel show both selections? How do we disambiguate? Not in scope for MVP, but the architecture decisions here (ring as state, panel as view) scale naturally to multi-user with per-user ring colors.

### 8.8 A/B testable variants

Wave 4 should instrument Phase 7 with three A/B candidates:
1. Press pulse duration: 60ms vs 40ms vs none.
2. Content fade duration: 80ms vs 120ms vs 60ms.
3. SAGE click behavior: soft dead zone (spec) vs full dead zone (no ring, cursor stays text).

Measure: click volume, time-in-panel, re-click rate (proxy for frustration), task completion (did the student end with more green sentences than they started with?).

### 8.9 Panel position customization

Power users may want the panel on the left, or pinnable-to-left, to accommodate handedness or monitor setup. Is this worth the complexity? Defer to actual user requests.

### 8.10 Keyboard shortcut for "jump to next critical sentence"

Phase 6 introduces keyboard shortcuts in the panel footer after first panel close. `J`/`K` for next/prev annotation is a natural addition; whether we filter to critical-only or cycle all tiers is an open call. Filter variant (`J` = next critical, `Shift+J` = next any tier) gives power users the most; may be too many shortcuts for novices.

### 8.11 Haptic beyond long-press

Current spec gives exactly one haptic (long-press trigger). Should rewrite-acceptance trigger haptic? Tier-transition (student's CRITICAL sentence becoming STRONG after edit) clearly wants a celebratory haptic, but that's Phase 9.

### 8.12 Density calibration for short essays

A 350-word PIQ may have only 15–20 sentences. Does the panel's click response feel different at that density (fewer sentences to click, each click is more load-bearing)? Or should PIQ mode collapse to a single-panel view that always shows all insights stacked? Wave 4 test.

---

## 9. Implementation Handoff Notes

### 9.1 File touchpoints (expected)

- `src/features/annotationEditor/components/SelectionRing.tsx` — new
- `src/features/annotationEditor/components/DetailPanel.tsx` — extend (from Phase 5)
- `src/features/annotationEditor/components/PanelHeader.tsx` — extend (meta line, tier strip interpolation)
- `src/features/annotationEditor/components/SentenceDecoration.tsx` — extend (press pulse, ring hookup)
- `src/features/annotationEditor/components/ParagraphGutter.tsx` — new
- `src/features/annotationEditor/components/BottomSheet.tsx` — new (mobile)
- `src/features/annotationEditor/hooks/useClickState.ts` — new (rapid-click state machine)
- `src/features/annotationEditor/hooks/usePanelScroll.ts` — new (scroll coordination)
- `src/features/annotationEditor/state/selectionStore.ts` — extend
- `src/features/annotationEditor/styles/tokens.css` — extend (ring tokens, tier accent tokens)

### 9.2 Tailwind / CSS tokens

```css
:root {
  --tier-critical-accent: oklch(0.55 0.18 25);
  --tier-critical-halo: oklch(0.55 0.18 25 / 0.2);
  --tier-needs-work-accent: oklch(0.7 0.14 65);
  --tier-needs-work-halo: oklch(0.7 0.14 65 / 0.2);
  --tier-functional-accent: oklch(0.75 0.04 150);
  --tier-functional-halo: oklch(0.75 0.04 150 / 0.15);
  --tier-strong-accent: oklch(0.6 0.15 140);
  --tier-strong-halo: oklch(0.6 0.15 140 / 0.2);
  --tier-exceptional-accent: oklch(0.65 0.14 195);
  --tier-exceptional-halo: oklch(0.65 0.14 195 / 0.22);
  --tier-masterful-accent: oklch(0.55 0.2 305);
  --tier-masterful-halo: oklch(0.55 0.2 305 / 0.25);

  --ring-blur-default: 8px;
  --ring-blur-pulse: 12px;
  --ring-stroke-width: 1.5px;

  --motion-in: cubic-bezier(0.22, 1, 0.36, 1);
  --motion-out: cubic-bezier(0.4, 0, 0.2, 1);
  --panel-slide: cubic-bezier(0.16, 1, 0.3, 1);
}
```

### 9.3 ProseMirror decoration model

Each annotated sentence is a `Decoration.inline(from, to, { class, nodeName, attributes })` with `class` set to `uplift-sentence uplift-sentence--tier-{TIER}`. On selection change, we add/remove `uplift-sentence--selected`. The ring is rendered via CSS `::before`/`::after` or via a secondary widget decoration layered above.

Decoration updates are driven by a Redux slice (or Zustand store — align with existing annotationEditor state model) keyed on `{ selectedSentenceId, selectedParagraphId }`. State changes trigger a ProseMirror `view.dispatch(tr.setMeta('uplift-selection', nextState))` which the decoration plugin reads.

### 9.4 Performance guardrails

- **No layout-triggering animations.** Every Phase 7 animation uses `transform`, `opacity`, or `box-shadow`. No `width`, `height`, `top`, `left`.
- **Debounce pointerdown detection.** Some touch devices fire `pointerdown` repeatedly; we gate with a 16ms (one frame) debounce.
- **Ring rendering cost.** One ring at a time. If the decoration plugin is asked to render more than one `--selected` decoration, we warn in dev and render only the last.
- **Panel content virtualization.** If Insights tab has 8+ cards (paragraph-scope edge case), virtualize with `@tanstack/react-virtual` to keep scroll smooth.

### 9.5 Testing matrix

| Test | Type | Phase 7 coverage |
|---|---|---|
| Click registers within 180ms | Performance | §2.1, §3.1 |
| Rapid 10-click-in-500ms settles on last | Interaction | §2.4, §3.3 |
| SAGE click renders empty state | Interaction | §2.6, §4.2 |
| Paragraph gutter click opens paragraph-scope | Interaction | §2.7 |
| Escape returns to overview | Interaction | §2.8 |
| Click-same re-pulses without reload | Interaction | §2.8, §3.7 |
| Editor does not reflow on panel collapse | Layout | §2.2 |
| Scroll keeps sentence in viewport within bounds | Interaction | §2.9 |
| Bottom sheet drag snap | Touch | §2.10, §5.2 |
| Long-press shows tooltip | Touch | §2.10, §5.5 |
| `prefers-reduced-motion` collapses all motion | Accessibility | §3.9 |
| Screen-reader announces selection change | Accessibility | §4.6 |
| Keyboard Tab + Enter equivalent to click | Accessibility | §2.5 |

---

## 10. Change Log & Inheritance

- **From Phase 4:** 60/40 layout lock, loading states (shimmer for >120ms fetch), cancellation infrastructure.
- **From Phase 5:** overview card as panel default, tier accent color palette, paragraph tints, two-wave bloom (not re-played on click), "Start here" chip (handed off to Phase 6).
- **From Phase 6:** Insights-tab exclusivity for first 60s (overridden by SAGE click's "View in Profile" CTA which is the exception), meta-line tier-name rendering as slow-drip legend, 12s nudge pulse on "Start here" chip.
- **Phase 7 additions:** selection ring, press pulse, panel content crossfade, rapid-click contract, SAGE soft dead zone, paragraph gutter click, Escape-to-overview, scroll coordination, bottom sheet on touch, long-press tooltip, tier-accent interpolation, click-same re-pulse.
- **Feeds Phase 8+:** keyboard navigation (extends ring logic), edit-in-place (extends rewrite-suggestion card), L6 conversation (extends panel surface model).
