# Phase 6: First-Time Orientation — UX Specification

> Wave 2 / Phase 6. Depends on Phases 4–5. Feeds all downstream phases (7+).
> Companion to `docs/INLINE_ANNOTATION_UX_PLAN.md` §5 Interaction Model, §11 Accessibility, §13 Progressive Disclosure. Inherits Phase 5 overview card, two-wave bloom, "Start here" chip.

---

## 1. Design Summary

Phase 6 is the stretch between Bloom-end (t=2600ms, per Phase 5) and the student's first five minutes inside the annotation system. The design thesis is **orientation through use, not through instruction**: no tutorial modal, no coach mark overlay, no dismissable tour. The student learns the pattern (color → click → insight → understanding) by performing it, and the UI seeds the first performance by handing them a perfectly-framed target (the "Start here" chip and the auto-selected strength from Phase 5). Five ambient hints, each tied to a specific UI anchor, fire at most once per user and teach exactly one capability per hint. The Insights tab is the exclusive home for the first ~60 seconds; the Profile tab is introduced only after the student has read two Insights. Filters and the coaching bar surface on evidence of need (density overwhelm or review count), not on a clock. Color legend is handled by the overview card's "strongest moment" pull-quote (which teaches *by example* that color = meaning) plus a hoverable tier-key in the toolbar's filter menu — never a persistent legend strip. Keyboard shortcuts are surfaced in the panel footer after the first panel close, where the affordance can't interrupt the read. Returning users get silence by default; unused-feature re-surfacing fires only on session 3+ when the feature would have helped the observed behavior. Screen readers get a parallel orientation path via a structured live-region announcement at Bloom-end and per-hint narration. The aesthetic stays vapor/glass throughout: hints breathe into view, dismiss without friction, and leave no residue in the UI.

---

## 2. The Ten Deep-Dive Decisions

### 2.1 Teach Through Doing, Not Telling

**Recommendation: a three-step "first loop" that runs within 30 seconds and teaches the color→click→insight→understanding pattern by having the student perform it once on a low-risk, high-reward target.**

The anti-pattern: a "Welcome! Here's how it works" modal that lists four bullets the student skims and forgets. Tutorials are acknowledged, not absorbed. The pattern we want to teach is procedural, not declarative — muscle, not memory — and muscle is trained by doing.

**The first loop (t=0s = Phase 6 entry at Bloom-end, inheriting Phase 5's state):**

1. **Step 1 — notice (t=0–3s).** Student arrives at Bloom-end. Panel shows overview card with pull-quote of their strongest sentence. Auto-selected strongest sentence carries a single luminous ring (Phase 5 §2.6). "Start here" chip is fading in at panel bottom-right. The student's eye tracks from their pull-quote in the panel to the same sentence in the editor, glowing. Color↔meaning encoded passively: *the teal sentence in my essay is the thing the panel is praising*.
2. **Step 2 — click (t=3–10s).** Two pulls compete, both designed: the strongest-sentence pulse, and the "Start here" chip. Either click is a win — both land them on an insight-card with WHAT-to-do and WHY. If they click the strongest sentence, they land on *why this worked* (the pattern: green = strength, click = "here's what you did right"). If they click the chip, they land on *what to try* for the top CRITICAL sentence (the pattern: red/amber = attention, click = "here's what to do"). Either way, the loop closes: color carried meaning, click gave me substance.
3. **Step 3 — understand (t=10–30s).** The Insight card that opens is structured the same for every annotation: `critique → why it matters → rewrite suggestion`. The student reads and absorbs not just this insight but the shape of every future insight. By the end of the read (~20s), they understand the contract.

**The invisible magic:** Phase 5's auto-selection and "Start here" chip are the orientation's tutorial, disguised as content. No modal. No dismiss. The student thinks they made a choice; they actually walked a scripted path whose script is spatial (pulse → chip) rather than textual (slide 1 → slide 2).

**Guarantee of closure:** if the student lingers ≥12s at Bloom-end without clicking *anything*, the "Start here" chip gets a single 400ms luminous pulse (the same pulse used on the auto-selected sentence) to reinforce the affordance. This is the *only* nudge we give; if they continue to sit, they're reading the essay or the pull-quote, which is also fine.

**What we explicitly do NOT do:**
- No coach marks with arrows pointing at the panel.
- No "Try clicking a red sentence" instructional toast.
- No numbered step overlay.
- No "1 of 4" dots.

### 2.2 Color Legend

**Recommendation: NO persistent legend strip. Two legend surfaces, each contextual and dismissable without friction.**

The "count my reds" anti-pattern is real and surveyed: students shown a tier legend alongside their essay spend 20–40s counting category membership ("I have 3 reds, 5 ambers…") before reading a single insight. The legend becomes a scorecard. We therefore surface color meaning only where it directly aids the next action.

**Surface A: the overview pull-quote teaches color-by-example.** The overview card's "Your strongest moment" pull-quote is tagged with *"¶4 · sentence 2 · EXCEPTIONAL"* and the sentence in the editor is underlined in the EXCEPTIONAL tier's teal. The student learns, on one example, "teal underline = EXCEPTIONAL" — the most positive tier. They don't need the whole ladder at first; they need to know the color is *a label*. Similarly, the "Start here" chip's target sentence is tagged with its tier in the insight card header. Two examples = pattern.

**Surface B: a hoverable tier key in the filter menu.** The toolbar houses a Filters icon (introduced later — §2.7). Inside the filters popover is a compact tier key:

```
┌──── tier key ────┐
│  CRITICAL      ~~│
│  NEEDS WORK    ──│
│  FUNCTIONAL      │  (hidden by default)
│  STRONG        ── │
│  EXCEPTIONAL    ──│
│  MASTERFUL     ✦──│
└───────────────────┘
```

Each row shows tier name, its underline swatch (the actual rendering: wavy for critical, shimmer for masterful, no mark for functional), and on hover/focus a one-line gloss (e.g., *"Below 40 — needs direct attention"*). The tier key is reachable via the filter menu but never forced; students find it when filtering by tier becomes relevant (§2.7), which is the moment the key is actually useful.

**Rejected alternatives:**
- *Persistent legend sidebar:* competes with the panel; screen real estate too precious; invites counting.
- *Legend on summary bar, hoverable:* fine in theory, but we don't have a summary bar at reveal (we have an overview *card* in the panel). Adding one would dilute the card.
- *Briefly-visible legend for 6s post-reveal:* tried mentally — it's a tutorial wall in disguise, disappearing before the student knows what to do with it.
- *Legend in panel footer always:* visual noise; every insight view carries it when only a fraction of views need it.

**Copy discipline:** when tier names appear in-context (e.g., in the insight card meta line *"¶4 · sentence 2 · EXCEPTIONAL"*), the tier word is the label. We don't add color swatches inline or "Learn more" links. The student sees `EXCEPTIONAL` next to a teal underline enough times (every insight they open) that the mapping locks in within the first session.

### 2.3 Progressive Hints (Registry)

**Recommendation: exactly five hints, each fires at most once per user (localStorage key), each anchored near the relevant UI, none require dismissal.** Full registry in §5; deep rationale per hint here.

The hint budget is tight on purpose. Every additional hint is a net tax on attention. Five is the ceiling we'll deploy; we'll measure dismissal and fire rates and cut any below 30% engagement within three months of launch.

Each hint obeys four rules:
1. **Anchored:** floats near the element it teaches, not in a screen corner.
2. **Ambient:** fades in, dismissable by click-outside, Escape, or by taking the taught action. No "×" button (which implies obligation).
3. **One-shot:** once the user takes the action or dismisses, the localStorage flag is set and the hint never reappears.
4. **Budgeted:** no two hints are on screen at once. If hint N's trigger fires while hint M is still visible, N queues behind M and fires only after M dismisses.

The five hints (detail in §5):
- `h1_profile_tab` — fires after 2 Insight reads.
- `h2_kb_shortcuts` — fires on first panel close via X/click-outside.
- `h3_filters` — fires when essay has >25 annotations visible AND user has opened ≥3 insights (density overwhelm signal).
- `h4_coaching_bar` — fires after 3 insights reviewed with coaching bar still collapsed.
- `h5_show_functional` — fires on first hover over a FUNCTIONAL (sage, unmarked) sentence in the editor.

**What we considered cutting:** hint 5 (`h5_show_functional`) is the most marginal. Students may never hover over an unmarked sentence with intent; the hint fires on hover duration ≥800ms on a sentence that has a tier score but no underline. If telemetry shows fire rate <5% in the first month, we retire it and ship with four hints.

### 2.4 Aha Moment Target

**Recommendation: the "I get it" moment must be guaranteed within the first click, which we deliver within 30 seconds of Bloom-end.**

The sequence that delivers "aha":

1. **Colors mean something** — delivered at Bloom-end by Phase 5 itself (underlines are colored, pull-quote is color-coded, paragraph tints are paragraph-tier). No extra work here.
2. **Clicking gives details** — delivered by the auto-selected sentence's panel content at t=2200ms of Phase 5. The panel is *already full of the selected sentence's insight* when the student arrives at Phase 6; they don't need to click anything to see that a sentence has a panel destination. The "click" lesson is taught by the *reverse* observation: *I see something in the panel, let me look at the essay and see which sentence it's about*. When they then click a different sentence, the panel updates — confirming the inverse.
3. **Details include WHAT to do and WHY** — delivered by the insight-card structure: every Insights-tab view has three sections, in this order:
   - **Critique** (1 short sentence, sage-toned): what the system noticed. Example: *"The verb 'looked' is doing less work than the image deserves."*
   - **Why it matters** (1–2 sentences, body text): the mechanism. Example: *"'Looked' is a neutral placeholder. In a sensory moment like this one, your reader needs a verb that carries texture — the verb is the camera lens."*
   - **Try this** (a concrete rewrite or move, shown as a styled block with a "Copy" affordance): the move. Example: *"Try: 'the dust **stung** between my grandmother's hands.' Or try any verb that fires more than one sense at once — taste, smell, weight."*

The structural guarantee: **every Insights card ships with all three sections, ordered critique → why → try.** No insight ever ships with only critique. No insight ever ships with a rewrite suggestion and no rationale. This makes the "aha" pattern learnable because it's invariant.

**Timing commitment:** within 30 seconds of Bloom-end, we need the student to have opened exactly one insight card and read its critique/why/try structure. Telemetry: median `time_to_first_insight_card_read_complete` < 25s.

**If they fail to arrive at aha (read but confused):** the panel footer shows, unobtrusively, a "Show me around (60 seconds)" link that expands a small inline checklist (not a modal) right there in the panel — this is the escape hatch for students who genuinely didn't absorb the pattern from ambient design. It's a safety net, not a first-class path.

### 2.5 Keyboard Shortcut Discovery

**Recommendation: shortcut discovery is deferred to the first panel close, surfaced as a single toast anchored to the panel's new "closed" affordance, and thereafter lives in the panel footer.**

Shortcuts we need to teach:
- `Tab` / `Shift+Tab` — cycle next/previous annotation in document order.
- `Enter` — open the focused annotation's insight in the panel.
- `Escape` — close the panel back to overview (or to empty-state on re-close).
- `/` — focus the filter field (introduced after §2.7).
- `?` — open the shortcut cheat sheet (the one modal we permit, because it's keyboard-opened and keyboard-closed, requested by the user, not imposed).

**When to teach:**

- **Not at Bloom-end.** Surfacing shortcuts during the first 30 seconds competes with the aha moment. Students won't retain them.
- **Not in a persistent toolbar strip.** Shortcut hints in a permanent strip become visual tax for 100% of sessions to benefit ~15% of power users.
- **At first panel close.** This is the moment the student has completed one full open→read→close loop. They've tasted the interaction; they're primed to ask "is there a faster way?" The hint `h2_kb_shortcuts` fires as a small, anchored tooltip on the panel edge: *"Tip: press Tab to jump between annotations. Esc to close."* It lives for 6s or until any keyboard action fires, whichever comes first. One time only.
- **Panel footer thereafter.** After the hint fires (whether absorbed or not), the panel footer carries a subtle `? shortcuts` pill (small, 11px, opacity 0.55 at rest; 1.0 on hover/focus). Clicking it opens the shortcut cheat sheet modal. This modal is the only full modal in the orientation system, and it exists because users who want it will open it deliberately.

**Shortcut cheat sheet modal content:**

```
Keyboard
Tab            Next annotation
Shift+Tab      Previous annotation
Enter          Open insight
Esc            Close panel
/              Focus filter
?              This menu
```

Plain, dense, dismissable with Escape or click-outside. No hero art, no "Pro tip!", no welcome copy.

### 2.6 Profile Tab Awareness

**Recommendation: do not surface the Profile tab until after the student has completed 2 Insights reads. Then introduce it via one hint (`h1_profile_tab`), anchored to the tab strip.**

The Profile tab shows L3 *understanding* — what the system thinks the sentence is doing, its intent, its craft moves. Insight is action-oriented ("what to do"); Profile is reflective ("what this is"). For a first-time user, Insight is urgent (it tells them what to change); Profile is curiosity (it tells them what the system sees). Order matters: discovery of Profile *before* Insight is absorbed dilutes the aha moment.

**Trigger:** after the user has read 2 Insights (defined as: opened the insight card and either scrolled the card, stayed on it ≥8s, or clicked the Copy affordance on the "Try this" block). The first Insight from Phase 5's auto-selection doesn't count toward the 2 — it wasn't a voluntary open.

**Surface:** the tab strip at the top of the panel has Insights (active, filled) and Profile (dim, 0.45 opacity) from the moment the panel opens. We don't hide Profile — we present it, dim, so the student registers its existence peripherally. The hint `h1_profile_tab` fires when the trigger conditions are met and the panel is currently open on an insight card. It's a small tooltip anchored above the Profile tab label:

*"This sentence has a profile too — what the system sees in it."*

Dismissal: click anywhere on the Profile tab (opens it + dismisses), click anywhere else (dismisses), or auto-dismiss after 8s.

**Copy rationale:** the hint uses "profile" (the tab name) and "sees" (reflective, observational — matches the Profile tab's L3 understanding content). It does *not* promise action. The student who clicks learns that Profile is a different kind of info, not competing with Insights.

**If they never click Profile in session 1:** the hint is spent but not reshown in session 1. Session 2+ re-surface logic (§2.9) may bring it back if Profile remains untouched.

### 2.7 Filter Discovery

**Recommendation: filters are introduced via `h3_filters`, triggered by density + engagement signals. Not by time, not by session count alone.**

Filters in the annotation system include: by tier (hide STRONG, show only CRITICAL, etc.), by paragraph role (HOOK only, FULCRUM only), by phase ("show me sentence-level only").

The trap is surfacing filters too early: a student with 15 total annotations doesn't benefit from filtering, and introducing filtering before they've absorbed the annotations themselves invites premature skipping ("just show me the reds") — the exact "count my reds" anti-pattern.

**Trigger:** `(annotation_count ≥ 25) AND (insights_read ≥ 3) AND (filters_never_opened)`. In words: the essay is dense, the student is clearly engaged (they've read three insights), and they haven't discovered filters yet. This is the moment filtering helps.

**Surface:** the hint anchors to the Filters icon in the toolbar (which is always present but unobtrusive). Tooltip:

*"You've got a lot here. Filter by tier or paragraph role."*

Clicking the Filters icon (or the hint itself) opens the filter popover, which contains the tier key from §2.2 and a paragraph-role checklist. Dismissal: open filters, Escape, click outside, or auto-dismiss after 10s.

**If the essay is short (≤25 annotations):** the hint never fires in session 1. Filters remain present in the toolbar, discoverable by affordance-browsers. Session 2+ may re-surface (§2.9).

### 2.8 Coaching Bar Awareness

**Recommendation: coaching bar is introduced via `h4_coaching_bar`, triggered by review count with bar still collapsed.**

The coaching bar is the collapsible bottom strip (per Wave 1 plan §7 layout) that houses the assistant chat and context-aware coaching prompts. It's collapsed by default at Bloom-end so it doesn't compete with the editor or panel during orientation. Its value is cumulative — it helps most when the student has built some context across multiple insights.

**Trigger:** `(insights_read ≥ 3) AND (coaching_bar_never_expanded)`. The session-3-insights threshold is identical to the filters trigger, but the hints are prioritized if they queue: coaching bar wins a tie (it's more important to the assisted-writing flow than filters are).

**Surface:** the coaching bar's collapsed state is a ~32px strip at the bottom of the viewport with a subtle "ask for help" caret. The hint anchors to that caret:

*"Stuck on one of these? Open this to talk it through."*

Clicking anywhere on the collapsed bar expands it. Dismissal on expand, Escape, click outside, or auto-dismiss after 10s.

**Why not "when they seem stuck"?** Stuckness is hard to detect reliably (long pause ≠ stuck; could be reading). Review count is a cleaner positive signal: if they've read three insights, they have material to ask about. The coaching bar becomes useful.

### 2.9 Returning User Onboarding

**Recommendation: session 2+ is silent by default. Re-surface logic fires only on session 3+, only for one unused feature per session, only if the student's observed behavior would have been helped by the feature.**

**Session detection:** a "session" is a distinct interaction window on a specific essay, separated from the previous by ≥12 hours. Count is stored per-user, per-essay in localStorage + server record. Note: same essay, 11 hours later = same session (prevents same-day false session counts from bathroom breaks).

**Session 1 behavior:** full orientation (hints 1–5 fire as triggered).

**Session 2 behavior:** **zero hints.** Every one-shot hint that hasn't fired yet is *paused* for this session, whether or not its trigger would have fired. The session 2 experience is: open essay, see annotations, use the system. No coaching. This is the respect session — the student proved they can return; we don't re-onboard them.

**Session 3+ behavior — the unused-feature re-surface:** at the start of session 3, the client inspects the feature-use record for this user:

- `profile_tab_opened`: boolean.
- `filters_opened`: boolean.
- `coaching_bar_expanded`: boolean.
- `shortcut_used_any`: boolean (Tab, Enter, Esc in the annotation context).

For each `false` field, we check whether the student's current session's *behavior so far* would have been helped by the feature:

- Profile tab unused AND current session has ≥2 Insight reads → re-fire `h1_profile_tab`.
- Filters unused AND current essay has ≥25 annotations → re-fire `h3_filters`.
- Coaching bar unused AND current session has ≥3 Insights read → re-fire `h4_coaching_bar`.
- Shortcuts unused AND current session has ≥5 panel opens → re-fire `h2_kb_shortcuts`.

**At most one hint per session 3+.** Priority order when multiple qualify: `h4_coaching_bar > h1_profile_tab > h3_filters > h2_kb_shortcuts`. Rationale: coaching bar is the highest-value feature for a returning student; Profile is the next-most-underused-but-valuable; filters and shortcuts are conveniences.

**Never re-fire a hint twice.** If a hint was re-surfaced in session 3 and still unused by session 4, the feature is marked "declined" and we respect that. Affordance remains present; we stop nudging.

**Copy variant for re-surfaced hints:** slightly different from session-1 version so returning users don't see literal repetition. Example: session-1 `h1_profile_tab` is *"This sentence has a profile too — what the system sees in it."* Re-surface variant (session 3) is *"You've been reading insights. The Profile tab shows what the system sees — try one."* More direct, acknowledges the user has history.

### 2.10 Accessibility of Onboarding

**Recommendation: every hint has a screen-reader-equivalent, keyboard-only users have a parallel discovery path, and color-blind users get redundant encoding (tier icons + tier text names).**

**Screen reader sequence (ARIA live regions, `aria-live="polite"`):**

1. **Bloom-end announcement (t=2600ms of Phase 5, t=0 of Phase 6):**
   > *"Analysis complete. Overview: your strongest moment is at paragraph 4, sentence 2, in the exceptional tier. Your improvement phase is Architecture. There are 4 things to try. Press Tab to step through annotations, or press Enter to open the highlighted sentence."*

   This is the orientation tutorial for screen-reader users, delivered as a single structured announcement. Keyboard-primary instruction included because they can't see the "Start here" chip.

2. **Per-hint narration:** each visual hint has an `aria-live` equivalent that announces the hint text when the hint becomes visible. The hint's anchor element also receives `aria-describedby` pointing to the hint text so focus-based readers pick it up. Hint narration is debounced — at most one hint narrated per 4 seconds.

3. **Panel state announcements:** every time the panel content changes (new sentence selected, tab switched), a polite announcement fires: *"Insight for paragraph 4, sentence 2. Critique: [first sentence of critique]."* Not the full insight — that would be disruptive — just the frame.

**Keyboard-only path:**

- Tab order at Bloom-end: first Tab lands on the "Start here" chip (if present). Second Tab lands on the auto-selected sentence in the editor. Third Tab begins iterating annotations in document order.
- All hints are dismissable by Escape.
- The shortcut cheat sheet (?) is the canonical keyboard affordance directory.
- No interaction requires hover. Any hover-revealed affordance (tier key tooltip, role label tooltip) is also reachable by keyboard focus.

**Color-blind redundancy:**

- Every tier has a **tier icon** (2px-wide glyph at the start of the underline, visible only for CRITICAL and MASTERFUL, which are the tiers most at risk of being confused with NEEDS WORK / EXCEPTIONAL respectively):
  - CRITICAL: small triangle glyph (⚠-like, monochrome)
  - MASTERFUL: small diamond glyph (◆-like, monochrome)
  - NEEDS WORK: no glyph (the amber color is unambiguous against green tiers in most common color-blindness modes)
  - STRONG/EXCEPTIONAL/FUNCTIONAL: no glyph
- Every tier name is present as **text** in the meta line of every insight card (*"¶4 · sentence 2 · EXCEPTIONAL"*). The text is the source of truth; color is redundant.
- Underline style is redundant: CRITICAL is wavy, all others solid. MASTERFUL has shimmer. Patterns survive monochrome.
- Default theme passes WCAG AA for all tier text colors against background. Dark mode variant retested separately.

**Motor / dexterity:**

- Click targets on the panel tabs and the "Start here" chip are minimum 44×44px touch target (desktop-inclusive, not just mobile).
- Hints dismiss on action (no need to find a close button).
- Shortcut cheat sheet makes full keyboard-only flow possible.

**Cognitive:**

- Hint copy is ≤14 words.
- All hints are optional (auto-dismiss exists). No hint blocks interaction.
- The "Show me around (60 seconds)" panel-footer link (§2.4 escape hatch) is the cognitive-load safety valve.

---

## 3. The First 30 Seconds After Bloom

Millisecond-to-second choreography from t=0 (Phase 5 handoff, Bloom-end) to t=30000ms.

| t | Student likely doing | UI state | Hint fires? | Pattern being taught |
|---|---|---|---|---|
| 0ms | Arriving at Bloom-end. Eyes on the editor first (their essay), then pulled to the panel by the overview card. | Panel: overview card with pull-quote of strongest sentence + auto-selected strength appended below. Editor: two waves of underlines have landed. Gutter: role labels present. "Start here" chip at panel bottom-right, just finished fading in. Auto-select sentence has just finished its single luminous ring pulse. | None. | — |
| 1500ms | Reading the pull-quote. Finding the matching sentence in the editor. Registering that the sentence is teal-underlined. | As above, static. | None. | Color = meaning (by example, implicit). |
| 3000ms | Eye scans to the editor. Notices a few green underlines, a couple of amber, one red. Processes tier hierarchy visually. | Static. | None. | Color = tier, visual only. |
| 6000ms | Panel's auto-selected insight is readable at this point; they're reading critique → why → try. Or they've jumped to the chip. | Panel shows insight card: critique / why / try. | None. | The insight card structure (invariant). |
| 10000ms | Either: finished reading auto-insight, exploring back up to overview. OR: clicked "Start here" and panel swapped to top-CRITICAL insight. OR: clicked a different sentence in the editor. | Panel content has changed OR student is reading. | None. | Click → panel update (reciprocity). |
| 12000ms | If still no click on anything: "Start here" chip receives single 400ms luminous pulse (the only orientation nudge). | Chip pulses once. | None. | Affordance reinforcement. |
| 15000ms | Most likely: second annotation opened. They clicked a red sentence or a green one to see what it says. | Panel shows second insight. Feature-use counter: `insights_read=1`. | None (threshold not hit). | Pattern repetition (critique/why/try is the same shape). |
| 20000ms | Reading second insight. Noticing the panel tabs at the top (Insights active, Profile dim). Profile is peripheral at this point. | Panel shows insight. Tab strip visible. | None. | Peripheral: a Profile tab exists. |
| 25000ms | Second insight fully absorbed. Counter `insights_read=2`. Hint `h1_profile_tab` queues to fire on next Insight tab view. | Panel static. | None yet — waits for a stable moment. | — |
| 28000ms | Student clicks a third sentence — third Insight view. `h1_profile_tab` fires 400ms after panel finishes loading the new insight (so it's anchored to a settled panel). | Insight card shows. Small tooltip above the Profile tab label: *"This sentence has a profile too — what the system sees in it."* | `h1_profile_tab`. | Profile tab exists + is for reflection. |
| 30000ms | Reading the hint + the new insight in parallel. Will either click Profile (teach) or click-away (dismiss). | As above. | — | Two tabs, two purposes. |

**"Aha" check at t=30000ms:** the student has done the color→click→insight→understanding loop at least twice (auto-selected sentence + one voluntary) and has been introduced to the Profile tab. The core pattern is installed. Every subsequent annotation reinforces it.

If at t=30s the student has clicked zero sentences and read only the auto-selected insight, the panel-footer "Show me around" link is now their scaffold; no automatic hints fire. This is the respect path: they're reading slowly, not stuck.

---

## 4. The First 5 Minutes

Rolling milestones, each keyed to a behavior threshold rather than a clock. Time estimates assume typical reading pace.

| Milestone | Trigger | Introduced | Why now |
|---|---|---|---|
| 0–0:30 | Bloom-end through first Insight read | Color↔meaning (Phase 5), click↔detail, insight-card structure | Core aha loop. |
| 0:30–1:00 | Second & third Insight reads | Profile tab (via `h1_profile_tab` after 2nd) | Student now reliably recognizes insight structure; ready for a second info surface. |
| 1:00–1:30 | First panel close | Keyboard shortcuts (via `h2_kb_shortcuts`) | They've completed one open→close loop; now curious about speed. |
| 1:30–2:30 | Fourth Insight read (if essay is dense) | Filters + coaching bar (via `h3`, `h4`) | Density-overwhelm territory; filters and coaching help. Otherwise silent. |
| 2:30–5:00 | Continued exploration or editing | Nothing new | All five hints have either fired or the student doesn't need them. UI is fully learned. |

**If the essay is short (<25 annotations) or the student is a slow reader:** milestones 1:30+ simply don't fire. The absence of hints is the feature; the student gets what they need and nothing more. Silence is the end state.

**If the student edits during this window:** editing triggers a re-analysis pipeline (Phase 4 diff mode). On return to Phase 6, hint state is preserved (localStorage survives re-analysis), so we don't re-hint. Counters are also preserved (reading insights from the first pass counts toward the thresholds of the second pass).

---

## 5. Hint Registry

| hint_id | Trigger condition | Copy | Position | Anchor element | Fire-once key (localStorage) |
|---|---|---|---|---|---|
| `h1_profile_tab` | `insights_read >= 2 AND profile_tab_opened == false AND current_panel_state == 'insight_visible'` | *"This sentence has a profile too — what the system sees in it."* | Tooltip above the Profile tab label | `[data-panel-tab="profile"]` | `uplift.orient.h1_profile_tab.seen.v1` |
| `h2_kb_shortcuts` | `first_panel_close_this_session == true AND close_method IN ('X_click','click_outside','Esc')` | *"Tip: press Tab to jump between annotations. Esc to close."* | Tooltip near panel-closed affordance (top-right edge of collapsed panel handle) | `[data-panel-handle]` | `uplift.orient.h2_kb_shortcuts.seen.v1` |
| `h3_filters` | `annotation_count >= 25 AND insights_read >= 3 AND filters_opened == false` | *"You've got a lot here. Filter by tier or paragraph role."* | Tooltip below the Filters icon in toolbar | `[data-toolbar-filters]` | `uplift.orient.h3_filters.seen.v1` |
| `h4_coaching_bar` | `insights_read >= 3 AND coaching_bar_expanded == false` | *"Stuck on one of these? Open this to talk it through."* | Tooltip above the coaching-bar caret | `[data-coaching-bar-caret]` | `uplift.orient.h4_coaching_bar.seen.v1` |
| `h5_show_functional` | `hover_duration_ms >= 800 ON sentence WHERE tier == 'FUNCTIONAL' AND show_functional_toggle == off` | *"That sentence is working fine. Turn on 'Show functional' to see all of them."* | Tooltip anchored to the hovered sentence (above) | `[data-sentence-id="<id>"]` | `uplift.orient.h5_show_functional.seen.v1` |

**Keying:** localStorage keys use a namespace `uplift.orient.<hint>.seen.v1`. The `.v1` suffix allows copy/behavior changes in future without re-firing to users who already saw the old version — we'd rev to `.v2` deliberately.

**Priority queue (if multiple hints satisfy triggers simultaneously):** `h4_coaching_bar > h1_profile_tab > h3_filters > h2_kb_shortcuts > h5_show_functional`. Only one hint visible at a time.

**Animation for all hints:** fade-in 220ms + 2px Y-translate from anchor; fade-out 160ms. Background: `bg-background/85 backdrop-blur-md`. Border: `1px solid hsl(var(--border)/0.4)`. Shadow: soft glass drop shadow. Matches vapor/glass aesthetic from Phases 4–5.

**Reduced-motion:** fade only, no Y-translate, duration 140ms.

---

## 6. Copy Deck

Every orientation-related string, numbered.

**Hints:**

1. `h1_profile_tab` — *"This sentence has a profile too — what the system sees in it."* — rationale: "profile" is the tab name (concrete); "what the system sees" is observational (matches Profile tab's L3 reflective content); no action verb (Profile is for reading, not doing).
2. `h1_profile_tab` session-3 re-surface — *"You've been reading insights. The Profile tab shows what the system sees — try one."* — rationale: acknowledges history, gentle imperative ("try one").
3. `h2_kb_shortcuts` — *"Tip: press Tab to jump between annotations. Esc to close."* — rationale: two specific keys named; "jump between" is spatial language; "Tip" framing = optional.
4. `h3_filters` — *"You've got a lot here. Filter by tier or paragraph role."* — rationale: "you've got a lot" validates their experience (yes, it IS a lot); names two concrete filter types so they know what's possible.
5. `h4_coaching_bar` — *"Stuck on one of these? Open this to talk it through."* — rationale: "stuck" names the likely feeling without pathologizing; "talk it through" is conversational; the "one of these" refers to the open insight.
6. `h5_show_functional` — *"That sentence is working fine. Turn on 'Show functional' to see all of them."* — rationale: reassures (it's fine — no problem); labels the toggle; "see all of them" frames as completeness, not criticism.

**Panel-footer shortcut pill:**

7. Pill label: *"? shortcuts"* — rationale: the `?` key is the standard open-cheat-sheet shortcut; word "shortcuts" plain and scannable.

**Shortcut cheat sheet modal:**

8. Modal title: *"Keyboard"* — rationale: single word, unambiguous; not "Shortcuts" because the word already appears in the opener.
9. Row: *"Tab — Next annotation"*
10. Row: *"Shift+Tab — Previous annotation"*
11. Row: *"Enter — Open insight"*
12. Row: *"Esc — Close panel"*
13. Row: *"/ — Focus filter"*
14. Row: *"? — This menu"*

**Screen-reader orientation announcement (Bloom-end):**

15. *"Analysis complete. Overview: your strongest moment is at paragraph {N}, sentence {M}, in the {TIER} tier. Your improvement phase is {PHASE}. There are {K} things to try. Press Tab to step through annotations, or press Enter to open the highlighted sentence."* — rationale: orders info the same as the visual overview card; keyboard instruction included because visual affordances (chip, pulse) are invisible to screen readers.

**Panel-footer escape hatch:**

16. Link copy: *"Show me around (60 seconds)"* — rationale: honest duration; "show me around" is spatial (matches what we're teaching — the UI as a place); parenthetical budget respects time.

**Inline mini-tour (expanded from #16):**

17. Step 1 of 3: *"The colors are tiers. Red/amber need attention; greens and teal are working well; purple shimmer is memorable."* — the only place the full tier taxonomy is spelled out. Three rows, no swatches (the actual underlines on the essay are the swatches).
18. Step 2 of 3: *"Click any underlined sentence. The right panel shows a critique, why it matters, and what to try."* — explicit description of the invariant.
19. Step 3 of 3: *"Use the Profile tab for what the sentence is doing, and the bar at the bottom to ask questions. That's it."* — names the two discovery-gated surfaces; terminal "That's it" because the tour really is that short.

**Returning-user re-surface copy variants** (sessions 3+):

20. `h3_filters` re-surface — *"Tip from last time — this essay's dense. Filters can help."* — rationale: "from last time" acknowledges session history.
21. `h4_coaching_bar` re-surface — *"The coaching bar's still down here if you want a second brain on any of these."* — rationale: "still down here" = it's been waiting; "second brain" = collaborative framing.

All copy: sentence case, no exclamation marks, no emojis, no "Awesome!" or "Great job!", no "Pro tip" (tacky), no "Did you know" (patronizing). Voice: calm tutor who trusts you.

---

## 7. Keyboard Shortcut Affordance Design

**Where shortcut hints appear:**

- **Primary surface — first-panel-close tooltip (`h2_kb_shortcuts`).** Fires once, lives 6s or until any keyboard action. Anchored to panel-closed affordance (the handle that reopens the panel). This is the highest-value moment: user has completed one open→close cycle, is primed to think about efficiency.

- **Persistent surface — panel footer shortcuts pill.** After `h2` fires (whether absorbed or not), a subtle 11px `? shortcuts` pill lives in the panel footer, right-aligned, opacity 0.55 at rest. On hover/focus: opacity 1.0, slight underline. Clicking opens the cheat sheet modal. Present throughout all subsequent sessions. Dismissable via settings ("Hide keyboard hints" toggle) for users who never want to see it.

- **Lightweight per-element hints — focus states.** When a panel tab or the filter icon receives keyboard focus, a 1-line `aria-describedby` associates a hint like "Enter to open" with the element. Screen readers announce it; sighted users never see it (it's aria-only). This is accessibility-first shortcut discovery for keyboard-only users who bypassed `h2`.

- **Cheat sheet modal (`?` key, or click the pill).** The canonical reference. Opens fast, closes fast, keyboard-navigable. No hero art.

**Why this layering works:** we surface shortcuts once overtly (`h2`), keep a quiet persistent door (footer pill), and provide deep reference (`?`). The hover-discoverable toolbar strip anti-pattern is avoided entirely.

**Shortcut *learning* vs *discovery*:** the shortcut cheat sheet doesn't teach shortcuts; it exposes them. The *teaching* happens by example in `h2`, which names two keys ("Tab" and "Esc"). Two keys is all we teach directly; the rest are for power users who open the cheat sheet and are motivated.

---

## 8. Returning User Logic

**Session detection:**
- Session = window of continuous activity on one essay, closed by >12h gap from last action.
- Stored per-user, per-essay: `session_count`, `last_session_end_ts`, `feature_use_flags`.
- On annotation route mount, increment session if gap condition met.

**Per-session behavior:**

| Session | Hints fire? | Feature re-surface? | Defaults |
|---|---|---|---|
| 1 | Yes, all 5 as triggered | N/A | Full orientation |
| 2 | **No** (silent) | No | Silent; respect return |
| 3+ | No new hints | Yes, one per session, priority order | Silent unless re-surface triggers |

**Re-surface trigger (session 3+):** on annotation-route-mount, compute:

```ts
const unused = [
  !featureUse.coaching_bar_expanded,
  !featureUse.profile_tab_opened,
  !featureUse.filters_opened,
  !featureUse.shortcut_used_any,
];
```

Evaluate in priority order. First match where the current session's *observed behavior* has met the "value threshold" triggers that hint's re-surface variant:

| Feature | Value threshold (this session) | Re-surface hint |
|---|---|---|
| `coaching_bar_expanded` | `insights_read >= 3` | `h4` (copy variant #21) |
| `profile_tab_opened` | `insights_read >= 2` | `h1` (copy variant #2) |
| `filters_opened` | `annotation_count >= 25` (essay property, not session) | `h3` (copy variant #20) |
| `shortcut_used_any` | `panel_opens >= 5` | `h2` (original copy) |

**One re-surface per session.** After firing, that hint is permanently retired (localStorage key set; no further surfacing, even if user continues not to use the feature). This is the respect-their-decline principle.

**Silence otherwise.** If no thresholds are met or all hints are retired, session 3+ is as silent as session 2.

**Session-level reset:** never. A user who logs out and creates a new account is a new user. A returning user with the same account keeps their orientation state. We never re-teach someone who has proven they know the system.

**Special case — big UI change:** if we ship a major revision (e.g., add a new major feature like an AI-generated comparison view), we rev the global orientation version (`.v2`). Hints that have been revved re-surface *once* for all users, regardless of prior fire state, on the first session after the rev. Marketing copy for this change is out of scope; the hint itself carries the discovery.

---

## 9. Accessibility Onboarding

**Screen reader sequence (`aria-live="polite"` region inside panel, `role="status"`):**

1. **At Bloom-end (t=0 of Phase 6):** copy #15 fires. Single announcement. `aria-atomic="true"` so the full message is read rather than deltas.

2. **On first panel state change after Bloom-end:** announcement fires with frame of the newly-selected annotation. Format: *"Insight for paragraph {N}, sentence {M}. Critique: {first sentence of critique}."* Debounced: at most one announcement per 2 seconds.

3. **On hint fire:** the hint's text is announced (copy #1–#6) with a brief delay (500ms after hint render) so keyboard focus has time to settle. Announcements debounced: one hint narration per 4s max.

4. **On tab switch (Insights ↔ Profile):** *"Showing {tab name} for paragraph {N}, sentence {M}."*

5. **On panel close:** *"Panel closed. Overview visible. Tab to next annotation or press slash to filter."*

**Keyboard-only path:**

- Tab order at Bloom-end: `[1] Start here chip → [2] Auto-selected sentence in editor → [3] Filter icon → [4] First annotation in document order → [5] Panel shortcut pill (if visible) → [6] Coaching bar handle`.
- `Enter` on the Start here chip opens the top-CRITICAL insight (equivalent to click).
- `Enter` on an editor annotation opens that annotation's insight.
- `Escape` in the panel closes the panel; `Escape` on a hint dismisses the hint.
- `/` focuses the filter input (from anywhere).
- `?` opens the shortcut cheat sheet modal (from anywhere).
- Tab cycles all interactive elements; `Shift+Tab` reverses.

**Focus management:**

- On annotation open via Enter: focus moves to the panel (specifically, the first heading of the insight card). Reader announces the insight frame.
- On panel close: focus returns to the last-focused annotation in the editor.
- No focus traps except the shortcut cheat sheet modal (which traps focus within the modal; Escape closes).

**Color-blind indicators:**

- Redundant encoding: tier text in every insight card meta line, tier name in tier key, tier icon on CRITICAL and MASTERFUL underlines (§2.10).
- Wavy underline for CRITICAL (pattern redundancy against amber NEEDS WORK).
- Shimmer effect for MASTERFUL (motion redundancy against teal EXCEPTIONAL).
- Default theme WCAG AA tested for all tier colors. Deuteranopia, protanopia, tritanopia previewed; no tier collapses into another.

**Reduced motion:**

- Auto-select luminous pulse collapses to static 600ms opacity change.
- "Start here" chip fade-in becomes instant appearance.
- All hint motion: fade only, no Y-translate, 140ms.
- Vapor/glass blur effects maintained (blur is aesthetic, not motion).

**High contrast mode:**

- All hints retain a `border: 2px solid` in high-contrast mode (glass morphism softer borders promoted to hard).
- Tier colors replaced with high-contrast palette: black/white/pattern redundancy dominant.

---

## 10. Mobile Adaptations

On <768px (per Wave 1 §15):

**Panel becomes a bottom sheet (already per Phase 5):**

- Hints anchor to their targets on the sheet, not floating over the editor. Ex: `h1_profile_tab` anchors to the Profile tab at the top of the sheet.
- Hints that anchor to toolbar elements (filters) anchor to the mobile toolbar's corresponding position (typically a bottom action bar or hamburger menu item).

**Touch affordances:**

- "Start here" chip is full-width at sheet bottom (per Phase 5 §8) — the first orientation action is thumb-reachable.
- Tab/Shift+Tab equivalent on mobile: swipe left/right on the sheet navigates previous/next annotation. `h2_kb_shortcuts` is replaced by `h2_swipe_hint`: *"Swipe left or right to jump between annotations."* Fires on first sheet close.
- Panel handle (the drag-bar at top of sheet) has a `aria-label="Panel drag handle. Swipe down to close."`

**No hover-based discovery:**

- Tier key in filters is reached by tap-to-open-filters-menu; no tooltip.
- Role label explainers are tap-to-expand, not hover.

**Coaching bar on mobile:**

- Coaching bar is a persistent small strip at the bottom of the sheet when sheet is at 55% height. `h4_coaching_bar` anchors to the strip.
- Expanded coaching bar takes over 85% of the sheet (sheet auto-expands).

**Screen reader on mobile:**

- Identical announcement sequence as desktop; all ARIA live regions work in VoiceOver/TalkBack.

**Orientation-specific mobile:**

- No cheat sheet modal; replaced by a single "Gestures" help item in the sheet's settings menu: *"Swipe: next/previous. Long-press: open profile."*

**Long-press as a second discovery channel:**

- On mobile, long-press (400ms) on any underlined sentence opens the Profile tab directly (instead of Insights). This is the mobile equivalent of the Profile tab's keyboard tab-switch. `h1_profile_tab` mobile copy: *"Long-press any sentence to see its profile — what the system sees."*

---

## 11. Backend Requirements

**Per-user orientation state (server-side record, keyed by `user_id`):**

```ts
interface OrientationState {
  userId: string;
  sessionCount: number;
  lastSessionEndTs: number;
  currentSessionStartTs: number;
  hintStates: {
    h1_profile_tab: { seen: boolean; seenAt?: number; resurfaced?: boolean };
    h2_kb_shortcuts: { seen: boolean; seenAt?: number; resurfaced?: boolean };
    h3_filters: { seen: boolean; seenAt?: number; resurfaced?: boolean };
    h4_coaching_bar: { seen: boolean; seenAt?: number; resurfaced?: boolean };
    h5_show_functional: { seen: boolean; seenAt?: number };
  };
  featureUse: {
    profile_tab_opened: boolean;
    profile_tab_opened_at?: number;
    filters_opened: boolean;
    filters_opened_at?: number;
    coaching_bar_expanded: boolean;
    coaching_bar_expanded_at?: number;
    shortcut_used_any: boolean;
    shortcut_used_at?: number;
    show_functional_toggle_on: boolean;
  };
  orientVersion: string; // e.g., "v1" — rev on major UI changes
}
```

**Per-session feature counters (client-side, flushed at session end):**

```ts
interface SessionCounters {
  sessionId: string;
  insightsRead: number;          // opened + read for 8s+ OR scrolled OR copied
  panelOpens: number;
  panelCloses: number;
  profileTabViews: number;
  filtersOpens: number;
  coachingBarExpansions: number;
  shortcutsUsed: number;
  annotationCount: number;       // snapshot of essay annotation count at session start
}
```

**Endpoints:**

```
GET  /api/orient/state
  returns: OrientationState

POST /api/orient/hint-seen
  body: { hintId: string, dismissalReason: 'acted' | 'dismissed' | 'auto' }
  returns: { ok: true }

POST /api/orient/feature-used
  body: { feature: string, timestamp: number }
  returns: { ok: true }

POST /api/orient/session-flush
  body: SessionCounters
  returns: { ok: true }
```

**Guarantees:**

- localStorage writes mirror every server write. On conflict (returning user on new device), server wins.
- `orientVersion` bumps invalidate hint-seen flags selectively (migrator logic per rev).
- Session-flush is idempotent; duplicates are merged server-side.

**Privacy:** no hint content or essay content is logged via these endpoints. Only event identifiers + timestamps. GDPR-compatible.

---

## 12. Success Metrics

**Primary (orientation worked?):**

- `time_to_first_insight_card_read_complete` — target median < 25s, p90 < 60s. Measures aha landing.
- `first_session_insights_read` — target median ≥ 3 in session 1. Measures engagement through the aha loop.
- `profile_tab_opened_within_session_1` — target ≥ 60% of users. Measures discovery of second surface.
- `hint_fire_to_action_rate` — per hint, target ≥ 40% (student takes the taught action within 30s of hint fire). Below this, the hint is suspect and we recut copy or retire.

**Secondary (orientation didn't annoy?):**

- `hint_dismiss_without_action_rate` — per hint, target ≤ 35%. Above 50%, the hint is a tax.
- `hint_seen_to_next_session_return_rate` — does seeing hint X correlate with session-2 return? Baseline established post-launch.
- `show_me_around_link_click_rate` — the escape hatch. Target ≤ 8%. If higher, ambient design is failing and we need to redesign the aha loop.

**Feature discovery within N sessions:**

- `profile_tab_discovered_within_3_sessions` — target ≥ 85%.
- `filters_discovered_within_5_sessions` — target ≥ 50% (filters have legitimate use case skip).
- `coaching_bar_discovered_within_5_sessions` — target ≥ 65%.
- `shortcuts_used_within_10_sessions` — target ≥ 25% (shortcuts are power-user; we accept low).

**Returning user health:**

- `session_2_engagement` — insights read per minute in session 2 vs session 1. Target ≥ 80% of session 1 (no onboarding friction on return).
- `resurface_hint_action_rate` — per re-surfaced hint, target ≥ 50% (higher than first-fire because we waited for context).

**Accessibility:**

- Screen-reader user satisfaction (qualitative, post-launch interviews): target ≥ 4/5 self-reported orientation clarity.
- Keyboard-only completion of first aha loop (open → read → close without mouse): target 100% feasible in usability testing.

**Telemetry dashboard:** the per-hint action rate and dismissal rate updated daily; retention of hints below threshold is a monthly review item.

---

## 13. Open Questions / Deferred

1. **Mini-tour completion rate.** The "Show me around (60 seconds)" link (copy #16) is the escape hatch. If it's clicked >8% of first sessions, ambient design is insufficient and we need a sharper aha loop. If clicked <1%, we may retire it. Defer to post-launch telemetry.
2. **Hint copy A/B.** Five variants per hint to test ("Tip:" prefix vs. none; imperative vs. declarative voice; second-person vs. third-person). Deferred to post-launch experimentation wave.
3. **Proactive Profile tab vs wait-for-context.** Current: wait for 2 Insights. Alternative: surface at Bloom-end as a quiet "two views" affordance. Worried about distraction from aha loop. Telemetry-gated test.
4. **Coaching bar as onboarding surface itself.** Could the coaching bar ask "Want a tour?" instead of us surfacing hints? Changes the whole paradigm; deferred until we have conversator v2 stable.
5. **"Start here" chip re-wording per session.** Phase 5 noted this as deferred. Phase 6 inherits the problem: after session 3, "Start with the top thing to try" feels stale. Rotation set needed.
6. **Cognitive load on `h3_filters` trigger threshold (25 annotations).** May need tuning by phase: FOUNDATION essays show fewer annotations but may still feel dense. Consider phase-aware threshold (e.g., 20 in FOUNDATION, 25 in CRAFT, 30 in POLISH).
7. **Power-user mode opt-in.** Some users may want all hints disabled from session 1. Consider a "I'm an advanced user" toggle in onboarding account setup. Currently no such toggle; defer until we see demand.
8. **Cross-essay orientation memory.** When a user starts their *second essay* (not second session on same essay), do hints re-fire? Current spec: hint-seen state is per-user-global, not per-essay. Second essay doesn't re-teach. Confirm with user research whether new essays feel contextually distinct enough to warrant re-introduction of some hints (likely no — system is the same).
9. **Hint copy for fallback states.** When Phase 5's `noStrongPlusExists` fallback fires (no STRONG+ sentence), is the aha loop weaker? The auto-selected strength is gone; only the promoted "Start here" chip carries the first interaction. Test aha-landing metric on early-draft essays specifically.
10. **Accessibility re-validation per hint.** Each hint's screen-reader announcement debounce (4s) and the panel-change announcement debounce (2s) may collide on fast interactors. Need SR-user testing to confirm announcements are neither lost nor chattering.
11. **Ambient hint styling during diff reveal.** Phase 5's diff mode doesn't re-trigger Phase 6 orientation (student has been here before), but if a hint was pending pre-diff, does it fire during or after the diff animation? Current spec: pending hints defer until diff animation is complete + 400ms. Verify UX feel in prototype.
12. **Mobile long-press for Profile.** Introduced in §10. Conflict risk with iOS long-press text selection. Needs platform-specific gesture implementation review (UIKit vs Android accessibility services).
