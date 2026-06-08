# Phase 5: First Results Reveal ("The Bloom") — UX Specification

> Wave 2 / Phase 5. Depends on Phase 4 (Loading). Feeds Phase 6 (Orientation), Phase 7 (Click → Panel).
> Companion to `docs/INLINE_ANNOTATION_UX_PLAN.md` §5 Interaction Model, §13 Progressive Disclosure, §14 Animation. Paragraph tints already on screen from Phase 4 hand-off.

---

## 1. Design Summary

Phase 5 is the emotional pivot of the product. Paragraph tints are already on screen from Phase 4's L3.5 pre-bloom; sentence underlines, gutter role labels, and the detail panel are held back for this moment. At `reveal_ready`, the UI executes a **strengths-first layered bloom**: overview stats materialize in the panel, a one-line narrative header glows into the toolbar region, gutter role labels fade in with their paragraph tints deepening, then sentence-level underlines bloom in two waves — **strengths and exceptional tier first (left-to-right)**, **critical and needs-work second (same sweep)** — so the student's first semantic scan of their essay encodes "I have strengths" before "I have problems." Sage-tier (55–75) sentences remain deliberately uncolored by default. The system auto-selects the student's **strongest sentence** into the panel after ~2.2s to seed positive-affect exploration; a subtle "Start here" chip suggests the top-priority critical annotation as the student's first voluntary move. The entire sequence resolves in ~2.6s. Re-analysis reveal is a different animation entirely: dissolves for changed annotations, greyed continuity for unchanged, and "new" tags for emergent insights. No emojis, no confetti, no percentage counters, no "you did it" moments. Calm, illuminating, respectful.

---

## 2. The Ten Deep-Dive Decisions

### 2.1 Reveal Choreography

**Recommendation: layered strengths-first bloom, left-to-right, over ~2.6s.** Not instant, not a wave that sweeps both directions, not a focus-spotlight-first.

Rejected alternatives:
- *Instant reveal:* dumps ~40–90 colored underlines at once. Dominant tier (whatever the majority is) visually overwhelms. If the essay has six amber paragraphs, the first 200ms encode "mostly amber" — a judgment we don't want to deliver as a flashbulb.
- *Single left-to-right wave (all tiers together):* works for paragraphs but for sentences it reads as "bloom the red first because it's at sentence 3." Order of appearance becomes a second, uncontrolled semantic channel.
- *Focus-first spotlight (highlight one sentence, dim rest):* feels like the tool has an opinion before the student has. Premature. Agency matters at t=0 of their first viewing.
- *Bottom-up or center-out bloom:* neither direction maps to reading order; reads as art-directed rather than meaningful.

**Choreography pickup from Phase 4 (paragraph tints already on screen):**

Phase 4 ended with vapor scan faded, paragraph-level background tints blooming L→R (200ms each, 50ms stagger), caption morphing toward "Ready." Phase 5 begins at the `reveal_ready` SSE event — roughly coincident with the final paragraph tint settling. The two phases cross-lap by ~180ms so there is no empty frame.

**Sequence (detail timeline in §3):**

1. **t=0–180ms — Cross-lap.** Final paragraph tint still settling; panel begins its slide-in from right. Paragraph tints **deepen** from 40% → 55% saturation (they were intentionally muted during Phase 4 to leave headroom for this moment). This is the single "something just changed" cue that draws the eye up from the paragraph-tint sweep.
2. **t=180–520ms — Panel fills.** The 40% right panel slide-in completes (250ms ease-out). Content crossfades in: overview stats block first (§2.2), not an auto-selected annotation.
3. **t=400–800ms — Gutter role labels fade in.** HOOK / BUILDUP / FULCRUM / RESOLUTION appear in the left gutter aligned to paragraphs, 180ms fade + 2px Y-translate each, stagger 40ms top→bottom. These precede the sentence underlines because paragraph role is the **frame** through which a student reads their sentence-level feedback.
4. **t=600–1500ms — Strengths wave.** Sentence underlines for **STRONG, EXCEPTIONAL, MASTERFUL** tiers bloom in, left-to-right across the essay. 160ms bloom per sentence, 35ms stagger. Underline draws in via `stroke-dashoffset` (not opacity) so it reads as *being drawn*, not materializing. Simultaneously, paragraph-tint saturation holds at 55%.
5. **t=900–1800ms — Header narrative glow.** A single line of copy (§6) fades into the toolbar region at the editor's top — not a modal, not a toast. 240ms fade, sits for the remainder of the reveal, dismisses on first interaction.
6. **t=1500–2400ms — Critical/needs-work wave.** CRITICAL and NEEDS WORK underlines bloom, same L→R sweep, 160ms each, 35ms stagger. Underline style: solid 2px with 0.7 opacity, wavy underline for CRITICAL only (matches §5 of Wave 1 plan). SAGE tier (55–75) never gets an underline by default — it is the visual silence that makes strengths and problems legible (§2.4).
7. **t=2200–2600ms — Auto-selection settle.** System auto-selects the student's **highest-scoring sentence** (the standout strength; see §2.6). Panel content crossfades from overview → selected-sentence insight, 200ms. A faint luminous ring pulses once on the selected sentence (400ms, single pulse, not repeating).
8. **t=2600ms — Interactive.** Full click/hover/keyboard interaction live. Phase 6 orientation takes over.

**Easing:**
- Underline bloom: `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quart — soft settle, no overshoot).
- Panel slide: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo — continues the scan bar's visual language).
- Saturation deepening: `ease-out` (cubic 0.25, 1, 0.5, 1).
- Auto-select pulse: `ease-in-out` (cubic 0.65, 0, 0.35, 1).

**Direction:** Always top-left to bottom-right, aligned with reading order. No exceptions for RTL languages in V1 (Uplift is English-only per product scope).

**`prefers-reduced-motion`:** All blooms collapse to a single 220ms crossfade at t=400ms. No staggers, no drawn-underline effect, no pulses. Panel slide becomes an instant appearance. The information arrives, the choreography doesn't.

### 2.2 Emotional Calibration

**Recommendation: overview stats first, then strengths wave, then header narrative, then critical wave — in that order.** The "oh no it's all red" risk is managed by *sequencing what the student sees in the first 1.5 seconds*.

The emotional peril: a student whose essay scored mostly 40–55 (needs-work) will, with naive choreography, see a wall of amber underlines as the first semantic signal post-Phase-4. Pre-frames every subsequent insight as damage control.

**Counter-design:**

1. **Panel fills with overview stats first (t≈500ms).** Before any underlines, the 40% right panel shows a compact overview card (§6 copy deck). Four data points: **paragraph count analyzed**, **strongest moment identified** (a positive anchor), **most important thing to try next** (singular, not a list), **your improvement phase** (Foundation / Architecture / Craft / Polish / Distinction — names the work ahead without characterizing the essay). The strongest moment is named first. Anchoring effect: whatever colors appear afterward, the first "fact" established is a strength.
2. **Strengths wave precedes critical wave.** STRONG/EXCEPTIONAL/MASTERFUL underlines appear in the first sub-second of sentence-level reveal (t=600–1500ms). A student's first *visual* scan encodes "there are green things here." Even if the essay is weak overall, there will almost always be 1–3 sentences in the STRONG+ tiers — we surface them first. If there genuinely are zero STRONG+ sentences (rare early drafts), the wave is skipped; the critical wave begins at t=600ms and the header narrative softens accordingly (§6).
3. **Header narrative (t=900ms).** A single line of copy, 16px, medium weight, sage-toned text, fades in above the editor. Template varies by the essay's strongest signal (§6). Examples: *"Your fulcrum moment is landing — now let's sharpen the build-up."* or *"The voice is clear. The structure needs one more pass."* This is **not** a score. It is a single-sentence curator's note that names one strength and one direction. The header never reads "Your essay needs a lot of work" or anything subtractive as its dominant clause.
4. **Critical wave is last, not first.** By the time amber and red underlines appear (t=1500ms), the student has already absorbed: the overview (fact-anchored), the strengths (visual-anchored), and the header (narrative-anchored). The critical marks land in a frame where they are one channel of information among three, not the first and loudest.
5. **No score, no percentage, no grade.** The panel never shows an aggregate 0–100 score. Aggregate scores invite comparison, archive, and rumination. Tier language (FUNCTIONAL, STRONG, EXCEPTIONAL) is used inline on individual annotations but never summed.
6. **No "red count" badge, no "critical issues" header.** Explicitly banned as overview content. The nearest we get is "X things to try" which is forward-looking, not damage-assessing.

### 2.3 Overview First?

**Recommendation: yes, panel-based overview card (not a modal, not an auto-selected annotation at t=0).**

Options evaluated:
- *Modal with summary stats:* disruptive. Modals imply gating and obligation; we want the student to feel invited, not briefed.
- *Auto-select top critical annotation:* primes pain. If the panel at t=0 says "Sentence 4 — needs work," the student's first cognitive frame is a weakness.
- *Auto-select strongest annotation:* better emotional tone, but skips the essay-level gestalt. The student loses the chance to see the shape before they see the detail.
- *Empty panel with "Click a sentence":* wastes 40% of the screen at the most emotionally loaded moment of the product. Unacceptable.

**Chosen path:**

A 40%-wide panel opens with a scroll-free overview card, three zones stacked:

```
┌──────────────────────────────────────────┐
│  YOUR ESSAY, ANALYZED                    │  ← supertitle, 12px uppercase, sage
│                                          │
│  Your strongest moment                   │  ← 13px label
│  "the dust between my grandmother's      │  ← pull-quote, 15px serif italic
│   hands was the first real thing."       │
│  ¶4 · sentence 2 · EXCEPTIONAL           │  ← 12px meta
│                                          │
│  Your improvement phase                  │  ← 13px label
│  ARCHITECTURE — paragraph-level          │  ← 14px semibold
│  Next: sharpen your build-up             │  ← 13px regular
│                                          │
│  ── 4 things to try ─────────────        │  ← 12px divider
│  (listed as clickable rows, first        │
│   collapsed; expand on click)            │
│                                          │
└──────────────────────────────────────────┘
```

The overview card persists in the panel until the first sentence is clicked. It is **not** replaced by the auto-selected-sentence at t=2.2s — see §2.6 for the correction on that point. The auto-selected sentence's insight appears **below** the overview card, not in place of it, and the panel auto-scrolls to it. The student can scroll back up to the overview any time, and can dismiss it (`Hide overview` link at the bottom of the card). The overview is persisted in their session so subsequent reveals of the same essay re-show it unless dismissed.

### 2.4 Color Density Management

**Recommendation: strict tier gating, phase-gated density, no "show everything" toggle by default.**

The core insight: total visible annotations should be roughly **constant** across essays of similar length, not proportional to number of issues found. An essay with 30 amber sentences shouldn't *look* four times worse than one with 8; that's the path to learned helplessness. Similarly, an essay with 70 FUNCTIONAL sentences shouldn't look worse than one with 10 EXCEPTIONAL and 60 FUNCTIONAL — the latter is better, but flooding both with sage underlines obscures the contrast.

**Default visibility rules (Foundation/Architecture/Craft phases):**

| Tier | Range | Default | Rendered as |
|---|---|---|---|
| CRITICAL | <40 | **Always visible** | Wavy red underline, 2px, opacity 0.85 |
| NEEDS WORK | 40–54 | **Always visible** | Solid amber underline, 2px, opacity 0.80 |
| FUNCTIONAL | 55–75 | **Invisible by default** | No underline; available via "Show all" toggle |
| STRONG | 76–85 | **Visible, understated** | Solid green underline, 1.5px, opacity 0.60 |
| EXCEPTIONAL | 86–95 | **Always visible** | Solid teal underline, 2px, opacity 0.75 |
| MASTERFUL | 96–100 | **Visible + distinguished** | Solid purple underline, 2px + faint shimmer overlay |

Why sage (FUNCTIONAL) is invisible: because "fine" is the default state of prose and doesn't need a mark. Underlining every functional sentence makes the page look audited, not analyzed. A student should perceive the sage tier as **unmarked** and read that as *nothing to worry about here*. This is the single biggest lever against overwhelm.

Why STRONG is understated (1.5px, 0.60 opacity): it's positive information, but STRONG is not *notable* — it's competent. Reserving bold treatment for EXCEPTIONAL preserves the hierarchy. MASTERFUL gets the shimmer because it marks genuine distinction.

**Phase-gated density overlay (compounds with tier rules):**

| Phase | Sentence underlines | Gutter | Panel emphasis | Word-level |
|---|---|---|---|---|
| FOUNDATION | CRITICAL + NEEDS WORK only. STRONG+ shown with a subtle glow on the paragraph number (not underline) so strengths register in peripheral vision without adding underline clutter. | Role labels hero, issue counts secondary. | Paragraph-level feedback dominant. | Hidden. |
| ARCHITECTURE | CRITICAL + NEEDS WORK + STRONG+ (same underline rules as above). | Role labels + connection lines between paragraphs on hover. | Paragraph + sentence mix. | Hidden. |
| CRAFT | Full default (per table above). | Role labels + issue counts. | Sentence view default. | Toggle available. |
| POLISH | Full, plus word-level highlights on by default. Sentence red/amber rare at this phase. | Role labels muted. | Word-level panel. | On by default. |
| DISTINCTION | MASTERFUL shimmer emphasized; CRITICAL/NEEDS WORK visually deprioritized (they're unlikely to exist; if they do, they still appear, but the phase is about sharpening). | Connection visualization hero. | "What makes this memorable." | On. |

**The "Show all" toggle:** present in the toolbar as a compact switch labeled *"Show functional sentences"* (off by default). When on, sage-tier underlines appear in the lightest possible treatment (1px dotted, opacity 0.35). Rationale for making it explicit and named: students who *want* to audit every sentence can, but the default protects against the reflex to look at everything at once.

Cumulative default density target: an average 650-word Common App essay should show **12–25 sentence underlines**, not 40+. The invisible sage majority does the work of making the visible minority legible.

### 2.5 Progressive Revelation

**Recommendation: two-wave reveal by tier valence (strengths → weaknesses), not by priority score.**

An alternative is a "show critical + strengths only at t=0, weaker items behind a toggle" — i.e., curate by importance. Rejected: the student's whole essay is tier-classified and they know it. Hiding half the verdict produces a "what are you not telling me" distrust. The issue isn't *how much* we show; it's *in what order* we show it, and at what default visibility.

**Wave structure (already specified in §2.1 timing):**

- **Wave 1 (t=600–1500ms): positive valence.** STRONG, EXCEPTIONAL, MASTERFUL underlines bloom in. Left-to-right across essay.
- **Wave 2 (t=1500–2400ms): constructive valence.** CRITICAL and NEEDS WORK underlines bloom in. Same L→R sweep.
- **FUNCTIONAL (sage):** never rendered by default (§2.4). If "Show all" is toggled on *after* reveal, sage underlines fade in over 400ms (no stagger).

Within each wave, order is strict reading order (top-left to bottom-right), not priority. Ordering the strengths wave by priority would land the "most notable" strength first — reinforcing a greatest-hits framing that disorients when the student tries to map panel content back to essay position.

**No "Show more" toggle for the initial reveal.** Everything that's going to appear, appears within 2.6s. A student discovering additional markings on a second toggle experiences a second wave of judgment ("oh, there's MORE problems I didn't see"). The commitment we make at reveal: what you see is what the system has to say, minus the sage tier which is explicitly functional.

### 2.6 First Auto-Selection

**Recommendation: auto-select the student's single strongest sentence (highest effectiveness score in the STRONG+ tiers) at t=2.2s, with a secondary "Start here" chip suggesting the top critical annotation as the student's next move.**

Evaluated:
- *No auto-selection (pure agency):* wastes the panel, and 60%+ of students click the first red thing they see by reflex, landing their first voluntary interaction on pain.
- *Auto-select top critical:* panel reads "Sentence 4 — Needs work" as the student's first detail view. Sets a corrective-feedback frame.
- *Auto-select top strength:* positive emotional anchor. Student's first detail view is "here's what's working and why." Frames everything subsequent as *extending* strength, not *fixing* weakness.
- *Auto-select the "most instructive" annotation (highest teaching value):* conceptually appealing but we don't have a reliable teaching-value signal independent of tier and priority. Defer until telemetry informs.

**Chosen path:**

- At t=2.2s, auto-select the **single highest-effectiveness-score STRONG+ sentence**. Tie-break: earliest in essay (simpler to locate). Second tie-break: longest sentence (more to teach from).
- Panel auto-scrolls to that annotation's insight, rendered **below** the overview card (not replacing it — §2.3).
- Sentence receives a one-shot 400ms luminous ring pulse (teal, opacity 0.0 → 0.35 → 0.0), then goes to static selected-state.
- Editor does **not** scroll to bring the sentence into view if it's off-screen. Scrolling pulls the student out of their wide-angle orientation. Instead, a small marker appears in the right gutter at the sentence's Y-position with a caret pointing into the editor ("Your strongest moment is at ¶4 — scroll down when you're ready"). The marker dismisses on any scroll.
- The **"Start here"** chip appears at t=2.4s, docked at the bottom-right of the panel, styled as a muted outline button: *"Start with the top thing to try →"*. Click takes the student to the top-priority CRITICAL or NEEDS WORK annotation. This is the bridge that makes the strength-first frame pedagogically honest: we started with strength, now we invite them into the work.

If no STRONG+ sentence exists (early-draft edge case): skip the auto-selection. Panel stays on overview. Header narrative copy is softened (§6). The "Start here" chip is promoted to primary button styling.

### 2.7 Sound & Haptics

**Recommendation: one subtle chime at t=0 of reveal, off by default, togglable in settings. Mobile haptic tick at t=0 on reveal.**

Sound:
- Token: a single soft "harmonic bloom" — a low-passed sine sweep from 440Hz to 880Hz over 400ms, -22 dBFS. Think of it as a held chime's attack, not a bell ring.
- Fires once at t=0 (the `reveal_ready` moment).
- Off by default on desktop. Toggle in settings (`Audio feedback`). Rationale for off-default: most students analyze essays in library/classroom settings where unexpected audio is disruptive and socially costly. Opt-in is the right posture.
- No sound during auto-selection, no sound on hover, no click-chime. This is the single audio event in the entire Phase 5 flow.

Haptics (mobile, iOS/Android):
- Single medium-weight tap (`UIImpactFeedbackGenerator.impactOccurred(.medium)` / Android `HapticFeedbackConstants.CONFIRM`) at t=0.
- On by default. Haptics is private by nature; no social cost to it firing in a classroom.
- No haptic during strengths wave or critical wave — the tiered blooms are visual and should stay that way.

No sound or haptic for the re-analysis reveal. Second and later reveals are lower-stakes; the audio signature would fatigue.

### 2.8 Gutter Reveal

**Recommendation: gutter role labels fade in during the cross-lap window (t=400–800ms), before sentence underlines.**

Options:
- *Role labels after underlines:* the student has to re-parse the essay after labels appear; sentence-level insights arrive unframed.
- *Role labels simultaneous with underlines:* compete for attention. Gutter motion overlaps with underline motion — visual noise.
- *Role labels before underlines (chosen):* establishes the structural frame first. The student's eye goes "HOOK / BUILDUP / FULCRUM / RESOLUTION" down the left margin and has a mental skeleton before the sentence-level verdict lands.

**Spec:**

- Labels appear in the existing left gutter (see §7 of Wave 1 plan) aligned to the top of each paragraph.
- Typography: 10px uppercase tracked, medium weight, sage-foreground color with 0.55 opacity at rest.
- Animation: fade-in 180ms + 2px Y-translate, staggered 40ms top→bottom. Total label-reveal duration for a 5-paragraph essay: 200ms (first label start) + 180ms (fade) + 4×40ms stagger = **540ms**.
- Labels persist throughout reveal and interaction. Hover reveals a 200ms-delay tooltip with the role's purpose (e.g., "Hook — draws the reader in").
- In FOUNDATION phase, labels have heightened treatment (opacity 0.75 instead of 0.55) per §13's "roles prominently" rule.
- Paragraph-tint deepening (from §2.1 step 1, 40% → 55% saturation) coincides with label fade-in, so the paragraphs "settle into" their labeled roles as a single perceptual event.

### 2.9 Panel State During Reveal

**Recommendation: panel slides in during the cross-lap window (t=180–430ms) and populates with the overview card (§2.3) as its first content. At t=2.2s, the auto-selected sentence's insight is *appended* below the overview; the panel auto-scrolls to it. The overview card remains available above.**

This decision is already folded into §2.3 and §2.6. Restating the sequence here for clarity:

- **t=0 to t=180ms:** panel is not yet visible (Phase 4's panel-closed state continues).
- **t=180–430ms:** panel slides in from right (250ms ease-out-expo). Background: glass, `backdrop-blur-xl`, `bg-background/80`. Content area shows the overview card in its final layout (contents fade in over 200ms concurrent with slide).
- **t=430–2200ms:** overview card is the only panel content. Readable, scannable, 4 zones (§2.3). The 40% panel space is fully used during the most emotionally loaded 1.8 seconds of the product.
- **t=2200ms:** auto-selected sentence's insight appears below overview card (scroll continues beneath overview). Panel auto-scrolls to the insight region over 300ms (smooth, ease-out). A sticky mini-header appears at the panel top: `Overview ↑ · Your strongest moment` — clickable to scroll back up.
- **t=2600ms onward:** panel is in its Phase 6 "orientation" state. User click on any sentence replaces the "selected sentence insight" region only; overview card remains accessible via scroll-up.

No empty-state copy, no "Click any sentence to see details" placeholder. The panel is always showing something meaningful.

### 2.10 Re-Analysis Reveal (Diff Mode)

**Recommendation: a distinct *diff animation* — not a re-bloom — that emphasizes change.**

After the first reveal, subsequent analyses (focused re-runs triggered by edits) arrive with a partial payload and a known delta against the prior reveal. Replaying the full bloom choreography on every re-analysis would be fatiguing and would erase the student's sense of continuity with their previous work.

**Diff reveal spec:**

- **Unchanged annotations:** render instantly at t=0 (no animation, no fade, just there). They are the ground state the student already knows. Muting their arrival tells the student "yes, these are still here."
- **Removed annotations (e.g., a critical sentence that rewrote into a strong one):** the old underline dissolves (300ms opacity 1→0 + `stroke-dashoffset` unwinding) at t=100ms, then at t=500ms the new tier's underline draws in (stroke-dashoffset animation, 400ms). The *transition* through an intermediate un-marked state is the emotional payoff — the student briefly sees their sentence bare, then sees it marked as improved.
- **Tier shifts (red → amber, amber → green, etc.):** cross-dissolve the old underline into the new one over 500ms. During the dissolve, color interpolates through a desaturated midpoint (per §14 Wave 1 spec: red desaturates → neutral → green saturates). A small "+N" or "−N" delta badge appears in the gutter briefly (600ms) to signal magnitude of improvement.
- **New annotations (ripple effects — e.g., edit to ¶2 surfaces an issue in ¶4):** underline draws in with a **sparkle edge** — a faint scintillating overlay for 800ms — and a small `new` tag (10px uppercase, teal background, white text) appears at the end of the underline, persisting for 10 seconds before fading. Panel-side, any newly added insight gets a `NEW` chip.
- **Overview card (re-analysis mode):** replaces "Your strongest moment" with **"What changed"** — a single pull-quote showing the sentence that improved most (largest effectiveness score delta upward). If no positive delta exists (rare), falls back to "What's new to try."
- **Header narrative:** different template (§6) — focused on change. Example: *"Your hook is sharper. Now the fulcrum's ready for a pass."*
- **Auto-selection:** instead of strongest sentence, auto-selects the **most-improved sentence** (largest positive tier shift). If zero positive shifts, falls back to the top "new to try" annotation.
- **Timing:** total diff animation ~1.2s (half the duration of first reveal). Fast enough to feel responsive after a focused re-run; slow enough to register change.
- **No sound, no haptic.** Second-time auditory/haptic cues fatigue.
- **`reveal_ready` payload for diff mode** carries `mode: 'diff'` and a `diff` object (§9).

---

## 3. Reveal Choreography Timeline

Millisecond-by-millisecond from t=0 (the `reveal_ready` SSE event) through t=2600ms.

| t (ms) | Event | Elements in motion |
|---|---|---|
| 0 | `reveal_ready` fires. Sound chime starts (if enabled). Haptic tap (mobile). | — |
| 0–180 | Phase 4 final paragraph tint still settling. Paragraph tint saturation begins deepening 40% → 55%. | Paragraph backgrounds. |
| 180 | Panel begins slide-in from right. Overview card content starts to fade in inside panel (concurrent). | Right panel. |
| 400 | Gutter role labels begin fading in (stagger 40ms top→bottom). Paragraph saturation deepening ~halfway. | Left gutter, paragraph backgrounds. |
| 430 | Panel slide-in completes. Overview card fully legible. | — |
| 600 | **Strengths wave begins.** First STRONG+ sentence underline starts drawing (160ms, 35ms stagger to next). | Editor sentence underlines. |
| 800 | Gutter labels complete. Paragraph saturation at 55% (settled). | — |
| 900 | Header narrative glow begins fading in above editor toolbar (240ms fade). | Header region. |
| 1140 | Header narrative settled. | — |
| 1500 | **Strengths wave complete** (approximate; depends on essay length — average 9 STRONG+ sentences × 35ms stagger + 160ms final bloom = ~1450ms from wave start). **Critical wave begins.** First CRITICAL/NEEDS-WORK sentence underline starts drawing. | Editor sentence underlines. |
| 2200 | Critical wave complete. **Auto-selection fires.** Highest-score STRONG+ sentence gets selected. Panel begins auto-scroll to insert selected-sentence insight below overview card (300ms smooth scroll). Luminous ring pulses on selected sentence (400ms single pulse). | Right panel, editor. |
| 2400 | "Start here" chip fades in at bottom-right of panel (200ms fade + 2px Y-translate). | Right panel. |
| 2600 | **Interactive.** All animations settled. Phase 6 orientation state begins. | — |

**Essay-length variations:**

Short essay (~400 words, ~20 sentences, ~3 STRONG+): strengths wave ends ~t=1000ms; critical wave starts at t=1000ms (compressed schedule). Total reveal duration: ~2200ms.

Long essay (~800 words, ~50 sentences, ~15 STRONG+): strengths wave extends to ~t=1700ms; critical wave pushed to t=1700ms. Total reveal: ~3000ms. Hard cap: if total would exceed 3500ms, stagger compresses to 20ms per sentence to stay under.

---

## 4. Motion & Timing Spec

| Element | Duration | Easing | Trigger |
|---|---|---|---|
| Paragraph tint saturation deepen (40% → 55%) | 600ms | ease-out (cubic 0.25, 1, 0.5, 1) | t=0 |
| Panel slide-in from right | 250ms | ease-out-expo (0.16, 1, 0.3, 1) | t=180 |
| Overview card contents fade-in | 200ms | ease-out | t=230 (during slide) |
| Gutter role label fade-in (each) | 180ms + 2px Y | ease-out | t=400 + (40ms × index) |
| Sentence underline bloom (strengths) | 160ms per sentence, 35ms stagger | ease-out-quart (0.22, 1, 0.36, 1) | t=600 |
| Header narrative fade-in | 240ms | ease-out | t=900 |
| Sentence underline bloom (critical) | 160ms per sentence, 35ms stagger | ease-out-quart | t=1500 |
| Panel auto-scroll to selected insight | 300ms | ease-out | t=2200 |
| Auto-selection luminous ring pulse | 400ms single (0 → 0.35 → 0 opacity) | ease-in-out (0.65, 0, 0.35, 1) | t=2200 |
| "Start here" chip fade-in | 200ms + 2px Y | ease-out | t=2400 |
| Sound chime (optional, off by default) | 400ms sine sweep 440→880Hz, -22dBFS | — | t=0 |
| Haptic tap (mobile) | medium weight, single | — | t=0 |
| Diff mode — unchanged render | instant | — | t=0 |
| Diff mode — removed underline dissolve | 300ms opacity + stroke-dashoffset | ease-in | t=100 |
| Diff mode — new tier draw-in | 400ms stroke-dashoffset | ease-out-quart | t=500 |
| Diff mode — tier-shift cross-dissolve | 500ms through desaturated midpoint | ease-in-out | t=300 |
| Diff mode — new annotation sparkle | 800ms scintillation overlay | ease-in-out | t=500 |
| Diff mode — "NEW" tag persistence | 10s, then 400ms fade-out | linear | post-bloom |
| Reduced-motion: all of the above | instant or 220ms crossfade | linear | — |

---

## 5. Density Rules by Improvement Phase

What's visible by default at reveal, per phase. Compounds with tier rules in §2.4.

**FOUNDATION (essay-level focus):**
- Sentence underlines: CRITICAL + NEEDS WORK only. STRONG+ shown as a soft halo on the paragraph number glyph in the gutter (peripheral-vision pat on the back without underline clutter).
- Gutter: role labels prominent (opacity 0.75). Issue counts suppressed.
- Paragraph tints: full saturation per §2.1.
- Panel overview: "Your strongest moment" cites the strongest paragraph (not sentence) to match the essay-level frame.
- Word-level: hidden entirely.
- Target density: 8–14 sentence underlines for an average essay.

**ARCHITECTURE (paragraph-level focus):**
- Sentence underlines: CRITICAL + NEEDS WORK + STRONG+ (all per §2.4 defaults).
- Gutter: role labels + paragraph connection affordances (hoverable dots indicating inter-paragraph connections).
- Paragraph tints: full saturation.
- Panel overview: strongest moment at sentence grain.
- Word-level: hidden.
- Target density: 12–22 sentence underlines.

**CRAFT (sentence-level focus):**
- Sentence underlines: full default per §2.4.
- Gutter: role labels + issue counts.
- Paragraph tints: slightly reduced saturation (50% instead of 55%) to let sentence-level detail dominate.
- Panel overview: strongest moment at sentence grain, plus a second pull-quote ("Try this technique across the essay").
- Word-level: toggle visible in toolbar, off by default at reveal.
- Target density: 15–28 sentence underlines.

**POLISH (word-level focus):**
- Sentence underlines: full default, but CRITICAL/NEEDS-WORK are rare at this phase. If they exist, they're highlighted with a subtle halo ("still something to address").
- Gutter: role labels muted (opacity 0.40).
- Paragraph tints: further reduced saturation (45%).
- Word-level: **on at reveal**. Individual word highlights appear during the critical wave (t=1500ms+) along with sentence underlines.
- Panel overview: "Words that are doing the most work" replaces "Your strongest moment."
- Target density: ~5 sentence underlines, ~15 word highlights.

**DISTINCTION (memorability focus):**
- Sentence underlines: MASTERFUL shimmer emphasized (shimmer starts at t=600ms, persists). CRITICAL/NEEDS-WORK visually deprioritized (opacity reduced from 0.85 → 0.55) — still present, still honest, but not the headline.
- Gutter: connection visualization (cross-paragraph echo lines) as hero.
- Paragraph tints: neutral (all paragraphs at equal low saturation); tier signal moves to shimmer and connections.
- Panel overview: "What makes this essay memorable" — a named quality (e.g., "The grandmother motif returns three times, each deeper"). No critical framing in the overview.
- Target density: very few underlines; connections and shimmers are the visible information.

---

## 6. Copy Deck

**Overview card strings:**

1. Supertitle: *"YOUR ESSAY, ANALYZED"* — all-caps, sage, 12px. Never "Your results" (results framing = grade).
2. Label: *"Your strongest moment"* — singular. Never plural ("your strongest moments") because plural invites counting.
3. Label: *"Your improvement phase"* — names the work, not a score.
4. Label: *"{N} things to try"* — singular if N=1 ("1 thing to try"). N is the count of CRITICAL + NEEDS-WORK annotations, capped at 4 in the overview list (overflow → "{N} total — see all below"). Never "{N} issues" or "{N} problems."
5. Meta line under pull-quote: *"¶{paragraphNumber} · sentence {sentenceNumber} · {TIER}"* — e.g., *"¶4 · sentence 2 · EXCEPTIONAL"*.
6. Fallback (no STRONG+ exists): *"Your essay's foundation is set. The next pass is where the voice sharpens."* — replaces pull-quote. Honest without being praise-y or alarming.
7. Hide link: *"Hide overview"* — not "Close" (close implies modal).

**Header narrative templates** — one line, variable based on which quadrant the essay lands in (highest-effectiveness dimension × improvement phase):

8. Strong structure + weak voice: *"Your shape is landing. Now let's pull the voice forward."*
9. Strong voice + weak structure: *"The voice is clear. The structure needs one more pass."*
10. Strong fulcrum + weak setup: *"Your fulcrum moment is landing — now let's sharpen the build-up."*
11. Balanced strengths, one clear gap: *"You've got {strength}. The work is in {gap}."*
12. Early draft (no STRONG+ yet): *"This is a first pass. Let's find the center."* — non-judgmental, forward-looking.
13. Near-final (mostly STRONG+, one or two NEEDS-WORK): *"You're close. A few sentences are ready for one more pass."*

**"Start here" chip copy:**

14. Default: *"Start with the top thing to try →"*
15. No STRONG+ variant (promoted to primary): *"Start with the first thing to try →"*
16. After auto-selected strength: *"Ready for the hard part?"* — appears only if student lingers >8s on the auto-selected strength without clicking elsewhere.

**Sage "show all" toggle:**

17. Off label: *"Show functional sentences"* — "functional" is the tier name and implies "working but not notable." Honest.
18. On label: *"Hide functional sentences"*.
19. Tooltip: *"Sentences that are working fine. Hidden by default so the ones that need attention stand out."*

**Gutter role labels (displayed verbatim):**

20. *HOOK*
21. *BUILDUP*
22. *FULCRUM*
23. *RESOLUTION*
24. *(no role detected)*: label is omitted (not shown as "UNKNOWN"). Better silent than mislabeled.

**Re-analysis (diff mode) overview:**

25. Label: *"What changed"* — replaces "Your strongest moment."
26. Pull-quote meta: *"¶{n} · sentence {m} · {OLD_TIER} → {NEW_TIER}"* — e.g., *"¶2 · sentence 3 · NEEDS WORK → STRONG"*.
27. Fallback (no positive deltas): *"What's new to try"* — labels the most-important new annotation.
28. `NEW` chip label on emergent annotations: *"NEW"* — 10px uppercase, teal bg.
29. Delta badge format: *"+12"* (effectiveness score shift) or *"tier up"* (qualitative). Auto-dismisses after 600ms.
30. Re-analysis header narrative: *"Your hook is sharper. Now the fulcrum's ready for a pass."* (templated — names improved element + next target).

**Empty-state hints (only if the panel ever goes empty — shouldn't happen at reveal but defensive):**

31. *"Click any sentence to see what the analysis noticed."* — plain, low-stakes.

All copy: sentence case, no exclamation marks, no "Oops!" or "Awesome!", no emojis, no "Congratulations" or "Great job." Tone: attentive coach, not cheerleader.

---

## 7. Re-analysis "Diff Reveal" Spec

Summary of differences from first-time bloom (already distributed through §2.10, §3, §4, §6):

| Aspect | First Reveal | Diff Reveal |
|---|---|---|
| Total duration | ~2600ms | ~1200ms |
| Sound | Optional chime at t=0 | None |
| Haptic (mobile) | Medium tap at t=0 | None |
| Unchanged annotations | Animate in | Render instant |
| Removed annotations | N/A | Dissolve + unwind stroke |
| Tier shifts | N/A | Cross-dissolve through desaturated midpoint + delta badge |
| New annotations | Draw-in as part of wave | Draw-in with sparkle edge + 10s `NEW` tag |
| Overview card | "Your strongest moment" | "What changed" |
| Auto-selection | Highest-score STRONG+ sentence | Most-improved sentence (largest +delta) |
| Header narrative | Template group A (§6 #8-13) | Template group B (#30) — change-focused |
| Strengths/critical wave split | Yes | No (changes animate in document order regardless of valence) |
| Paragraph tint deepen | Yes | No (paragraphs already saturated from prior reveal) |
| Gutter label animation | Fade in | Static (already present) |

The throughline: first reveal teaches the map; diff reveal shows the weather change on a map the student already knows.

---

## 8. Mobile Adaptations

On <768px (§15 of Wave 1 plan — right panel becomes bottom sheet):

- **Panel slide-in replaced with bottom-sheet spring-up.** Sheet springs up from bottom over 280ms (spring: stiffness 180, damping 22), to 55% viewport height by default, draggable to 85%, swipe-down to dismiss. At reveal, sheet opens automatically to 55% height with overview card.
- **Left-to-right bloom replaced with top-to-bottom bloom.** On narrow viewports, L→R visual reading order flattens into top-to-bottom. Strengths wave sweeps top-to-bottom (not left-to-right). Critical wave same.
- **Underlines become left borders.** Per Wave 1 §15, mobile renders tier as a 3px colored left border on the paragraph block rather than per-sentence underlines (too small). Tier-mixed paragraphs show the dominant tier's color plus a tiny indicator dot in the gutter for each additional tier present. Sentence-level tier is still accessible on tap.
- **Gutter role labels** shift to inline paragraph headers (tiny uppercase line above each paragraph) since gutter space is collapsed.
- **Haptic tap at t=0** (confirmed primary feedback channel on mobile — see §2.7).
- **Stagger compressed** to 20ms between paragraph blocks (vs 35ms sentences on desktop) — shorter essays on mobile feel more responsive.
- **Auto-selection** still fires at t=2200ms; sheet auto-scrolls to the selected-sentence insight. If sheet is at 55% height and the selected sentence is above the sheet, a floating "Scroll up" chip appears ("Your strongest moment is above").
- **"Start here" chip** pinned at the sheet's bottom as a full-width button (not a corner chip) for thumb reach.
- **Diff reveal on mobile:** same spec as desktop, but sparkle edge is simplified to a one-shot 400ms glow (scintillation is CPU-heavy on mid-range phones).

Touch-friendly density: on tier tap, sheet expands to 85% and loads the insight. No hover state (no tooltips for role labels on mobile — they open the role explainer in the sheet on tap instead).

---

## 9. Backend Requirements

**`reveal_ready` SSE event payload (first reveal):**

```ts
{
  type: 'reveal_ready',
  mode: 'first',
  timestampMs: number,
  analysisId: string,
  essay: {
    paragraphs: Paragraph[],           // with role, tierScore, tintColor
    sentences: Sentence[],             // with range, effectivenessScore, tier, priority
  },
  insights: {
    strongestSentenceId: string,       // drives auto-selection
    topPriorityCriticalId: string | null, // drives "Start here" chip
    improvementPhase: 'Foundation' | 'Architecture' | 'Craft' | 'Polish' | 'Distinction',
    headerNarrativeTemplateId: string, // maps to §6 copy IDs 8-13
    headerNarrativeVariables: Record<string, string>, // for template substitution
    overviewThingsToTry: Array<{ sentenceId: string, label: string, priority: number }>,
    noStrongPlusExists: boolean,       // triggers §2.6 fallback
  },
  renderHints: {
    recommendedDensityProfile: 'foundation' | 'architecture' | 'craft' | 'polish' | 'distinction',
    estimatedUnderlineCount: number,   // for stagger-compression logic (§3)
  },
}
```

**`reveal_ready` payload (diff mode):**

```ts
{
  type: 'reveal_ready',
  mode: 'diff',
  timestampMs: number,
  analysisId: string,
  priorAnalysisId: string,
  essay: { /* same as first */ },
  insights: { /* same as first, plus: */
    mostImprovedSentenceId: string | null,
    noPositiveDeltasExist: boolean,
  },
  diff: {
    unchangedSentenceIds: string[],
    removedAnnotationIds: string[],          // old annotations that no longer apply
    tierShifts: Array<{
      sentenceId: string,
      oldTier: Tier,
      newTier: Tier,
      oldScore: number,
      newScore: number,
    }>,
    newAnnotationIds: string[],              // emergent from edits (ripples)
    positiveDeltaCount: number,
    negativeDeltaCount: number,
  },
  renderHints: { /* same as first */ },
}
```

**Guarantees the backend must provide:**
- `strongestSentenceId` and `topPriorityCriticalId` are always either a valid sentence ID or `null`. Client handles `null` via the fallback paths (§2.6).
- `headerNarrativeTemplateId` always resolves to a template in §6. Unknown IDs fall back to #12 ("first pass").
- `tierShifts` includes only sentences where the tier actually changed bucket (not sub-bucket score wiggles). Minor score drift within a tier does not surface as a shift.
- `diff` object is absent when `mode === 'first'`; required when `mode === 'diff'`.
- Paragraph `tintColor` values in the first-reveal payload match the Phase 4 pre-bloom tints exactly (no color change across the Phase 4→5 seam — only saturation deepening).
- `estimatedUnderlineCount` drives the stagger-compression decision. If estimated total reveal would exceed 3500ms at default stagger, client compresses per §3.

**Differentiation flag:** `mode: 'first' | 'diff'` is the single flag the client uses to select choreography. Server decides based on whether a prior `reveal_ready` exists for this essay + user + session.

---

## 10. Emotional Journey Map

Second-by-second, the first 3 seconds post-`reveal_ready`.

| t | Student feels | UI delivers |
|---|---|---|
| 0.0s | Held breath. "Okay. Show me." | Chime (if on) + haptic. Paragraph tints deepen (they already saw these during loading — now they're committing). Panel starts sliding in. |
| 0.2s | Orientation. "Something's happening on the right." | Panel slide-in in progress. Paragraph tints settled. Gutter labels starting to appear. |
| 0.5s | First fact lands. "Oh — my strongest moment is a real sentence it's naming." | Overview card fully visible. Gutter labels appearing. No sentence underlines yet. |
| 0.7s | "Okay it's not all red." | Strengths wave begins. First green/teal underline draws in on an early sentence. Subtle visual reassurance before the hard part. |
| 1.0s | Frame consolidates. "I have a hook, a buildup, a fulcrum." | Gutter labels complete. Strengths continuing L→R. |
| 1.3s | Narrative lands. "The voice is clear. The structure needs a pass." | Header narrative fully faded in. Strengths wave still running through the middle of the essay. |
| 1.5s | Breath. "Here comes the criticism." | Last strengths bloom in; critical wave begins. |
| 1.8s | "Yeah, I knew that sentence was weak." Validation, not shock. | Critical underlines proceeding L→R. The student's instincts are getting confirmed rather than ambushed. |
| 2.2s | Attention redirects right. "What does this one say?" (The strongest.) | Auto-selection pulses on strongest sentence. Panel scrolls to its insight. |
| 2.4s | Invitation. "Okay — where do I actually start?" | "Start here" chip appears. |
| 2.6s | Ready. "Let me read." | Everything still. Cursor free. Editor interactive. |
| 3.0s | First voluntary click (on "Start here" or on a sentence). | Phase 6 orientation owns from here. |

The emotional goal: at t=2.6s, the student's internal state is **alert curiosity**, not defensive dread. They know their shape, they have a strength named and quoted, they have a single direction to go, and they have permission to proceed at their own pace.

Three cardinal sins Phase 5 avoids: (1) making red the first visual signal after Phase 4 paragraph tints, (2) asking for a decision before orientation, (3) speaking in scores.

---

## 11. Open Questions / Deferred

1. **A/B strengths-first vs neutral reveal.** We're opinionated that strengths-first is correct. Once we have retention + engagement telemetry, run a controlled test: neutral-order bloom vs strengths-first. Hypothesis: strengths-first yields higher second-session return and more words edited in session 1. Deferred.
2. **Dynamic reveal tempo by essay draft stage.** Should the choreography speed up for late-stage drafts (where the student has already seen 5 analyses of this essay)? Probably — fatigue matters — but the exact speed curve needs usage data. Deferred.
3. **Header narrative templating vs LLM generation.** Current spec uses a small template set (§6 #8-13). A richer approach is an LLM-generated one-liner per analysis. Cost and quality-floor concerns. Templates for V1, LLM generation as a telemetry-gated experiment for V1.1.
4. **Shimmer effect for MASTERFUL tier — CPU impact on mobile.** Shimmer is currently spec'd but we haven't benchmarked on mid-range Android. May need to downgrade to static gold-tint on low-end devices. Engineering verification deferred.
5. **"Start here" chip copy after repeated analyses.** Fourth-time seeing "Start with the top thing to try" feels robotic. Need a rotating copy set or a context-aware variant. Deferred to post-launch.
6. **Overview card persistence across sessions.** Currently spec'd as "remembers until dismissed per essay." Should dismissal carry across essays (user-level)? Probably no — every essay deserves the overview — but confirm with user research.
7. **Audio chime design.** Spec'd as a harmonic sine sweep. A designed sample (field recording + synthesis) may feel more premium. Sound-design pass deferred to post-MVP.
8. **Re-analysis reveal for large diffs.** If a student rewrites a whole paragraph and the diff contains 10+ tier shifts, the diff animation may feel chaotic. A "large diff" threshold (>6 changes?) might trigger a full re-bloom instead of diff mode. Telemetry-gated decision.
9. **Reduced-motion auto-selection.** When reduced-motion is on, should we still auto-select the strongest sentence, or default to the overview card only? Current spec: auto-select still fires (the content is valuable; only the animation is muted). Accessibility review needed before lock-in.
10. **Non-English essay support.** Paragraph role labels (HOOK, BUILDUP, FULCRUM, RESOLUTION) are English-only; L→R choreography assumes LTR scripts. V1 is English-only; V2 internationalization owns this.
