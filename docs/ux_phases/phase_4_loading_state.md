# Phase 4: Analysis Loading State — UX Specification

> Wave 2 / Phase 4. Depends on Phase 3 (Analysis Trigger). Feeds Phase 5 (First Reveal).
> Companion to `docs/INLINE_ANNOTATION_UX_PLAN.md` §3 Editor Foundation, §7 Layout, §8 Toolbar, §9 Data Flow, §14 Animation. Vapor/glass aesthetic inherited.

---

## 1. Design Summary

Phase 4 covers the 8–20s window between "Analyze" click and first annotated reveal. The editor stays **soft-locked** (read-only, text fully visible, cursor preserved) while a **vapor scan** — a low-contrast luminous band — drifts top-to-bottom across the essay, timed to actual layer progress from a **Server-Sent Events (SSE)** stream. The toolbar hosts a single **segmented progress ribbon** with seven layer dots and a human-readable caption that swaps as layers complete ("Reading the essay…" → "Tracing connections…" → "Hearing your voice…"). **Results stream in progressively**: paragraph tints bloom in as each layer finalizes, but sentence-level detail stays hidden until L5 completes to avoid a half-baked first impression. Fast path (2–3s focused re-analysis) gets a minimum display time of 600ms to keep motion legible. Slow path (>15s) swaps caption to a reassurance tier. Cancellation is always available; partial failures refund proportionally. No emojis, no percentage numbers, no spinners.

---

## 2. The Ten Deep-Dive Decisions

### 2.1 Progress Communication

**Recommendation: segmented ribbon (7 dots) + single rotating caption + vapor scan.** Not a percentage bar, not a step wizard.

Why not a percentage: layer durations are uneven (L1 ≈ 1s, L5 ≈ 4–7s). A linear percentage lies — it hits 60% fast then stalls, which feels broken. Why not a stepper/wizard: seven named steps competing for attention is cognitive overload; students skim and fixate on the scary-looking ones ("deep annotations?"). Why the ribbon: it encodes progress through **filled dots** (cheap, legible, no false precision) and a single rotating caption that translates the current layer into student-language.

**Ribbon structure (toolbar, center-aligned, replacing the "Analyze" CTA during Phase 4):**

```
[ • — • — • — • — • — • — • ]   Hearing your voice…
 L1  L2 L2.5 L3 L3.75 L3.5  L5
```

- 7 dots (L4 is merged into L3.75 visually — see below), each 6px, 2px gap, connected by a 1px hairline.
- States: `pending` (hsl(220 10% 70% / 0.3)), `active` (current layer — pulsing, hsl(var(--anno-exceptional)) at 80% + gentle 1.5s breathe), `done` (solid hsl(var(--anno-strong))).
- Caption below ribbon, 13px, `font-feature-settings: "ss01"`, opacity animates 0 → 1 over 180ms on swap.

**Layer captions (each shown while that layer is active).** These are copy, not logs:

| Layer | Technical | User-facing caption | Why this copy |
|---|---|---|---|
| L1 | Haiku first impressions | **"Reading the essay…"** | Matches the student's mental model — we read first, then think. |
| L2 | Sonnet structural | **"Mapping the structure…"** | "Structure" is college-essay vocabulary; students know this matters. |
| L2.5 | Haiku connection scout | **"Tracing connections across paragraphs…"** | Reveals that we see the whole arc, not isolated sentences. |
| L3 | Sonnet understanding walk | **"Walking through sentence by sentence…"** | The honest, slow-sounding one. Signals depth; calibrates expectations. |
| L3.75 | Sonnet holistic synthesis | **"Hearing your voice…"** | Emotional peak. Most evocative string — students feel *seen*. |
| L3.5 | Sonnet analysis pass | **"Judging what's working…"** | Explicit framing: understanding precedes judgment. |
| L4 (merged into L3.75's tail) | North Star | *(no separate caption)* | Too technical; its output is consumed by L5. |
| L5 | Sonnet deep annotations | **"Writing your annotations…"** | Ownership language. These are *your* annotations. |

On transition: the current caption fades (120ms), new one fades in (180ms) with 2px Y-translate. No caption ever reads "Layer 3.5 of 8."

### 2.2 Incremental vs Batch Results

**Recommendation: progressive paragraph-tint, batched sentence detail.**

Trade-off framing: showing L1 first impressions at ~2s feels magical but primes students with shallow judgments we'll overwrite at L3.5. Showing nothing until 18s feels dead and increases abandonment. Split the difference by *what* is revealed, not *whether*.

- **At L2 completion (~3s):** paragraph gutter shows structural affordances appearing (soft dot markers), no color yet.
- **At L3.5 completion (~9–12s):** paragraph-level tints bloom in, left-to-right across the essay, 200ms per paragraph with 50ms stagger (§14 of Wave 1 plan — we reuse the "wave effect"). This is the first semantic signal — students see the *shape* of their essay (mostly sage/green, or a cluster of amber paragraphs). No sentence-level detail, no panel content yet.
- **At L5 completion (full pipeline done):** sentence-level underlines and gutter badges bloom in, right-panel opens for the first time. This is the Phase 5 hand-off.

Why sentence detail is batched: L3 produces understanding (prose, not annotations). L3.5 produces judgments (effectiveness scores). L5 produces the *teaching* — the "try this instead" overlays. A student seeing judgments without teaching will panic at the red underlines before we can show them what to do. Batch the reveal of anything that could feel like criticism until the coaching exists to soften it.

### 2.3 Editing During Analysis

**Recommendation: soft-locked read-only with a cursor preserved and graceful escape.**

Options considered:
- *Free edit:* Divergence between analyzed snapshot and visible text. On reveal, annotations point to stale positions. Unacceptable.
- *Hard lock (disabled, dimmed):* Feels punishing; 16-year-olds interpret it as "you can't touch your own writing."
- *Hybrid overlay:* Cognitive cost of "why can't I click there?" moments.

**Soft lock spec:**
- TipTap `editor.setEditable(false)` on trigger; text opacity stays at 100%; cursor remains where it was; selection preserved (so they can re-read, copy-paste out).
- **Keypress handler** intercepts any edit attempt (typing, paste, delete). On first keypress, inline toast slides down from the toolbar: *"Analysis in progress. Cancel to keep editing, or wait about 15 seconds."* Two buttons: `Cancel analysis` (primary ghost) / `Wait` (secondary). Toast auto-dismisses after 6s.
- Scrolling, text selection, link clicks, panel/coaching-bar interaction all remain live.
- Toolbar "Analyze" CTA is replaced by the ribbon (§2.1); all other toolbar actions (phase selector, filters) remain functional but won't take effect until analysis completes.

Why: preserves sense of control, prevents divergence, and the escape (cancel) is always one click away.

### 2.4 Animation & Visual Design

**Recommendation: the vapor scan** — a single low-contrast luminous band that drifts top-to-bottom across the editor, synced to overall progress (not per-layer). Everything else stays static.

Rejected alternatives:
- *Sequential paragraph highlight left-to-right:* implies paragraphs are being analyzed in order, which isn't literally true for L3/L3.5 (they see the whole essay). Misleading.
- *Translucent overlay over the whole essay:* blocks reading, feels like a modal.
- *Shimmer/skeleton:* designed for content that isn't there yet. Our content IS there. Shimmer would imply replacement.
- *Unchanged text + toolbar-only progress:* honest but emotionally flat for an 8–20s wait.

**Vapor Scan spec:**

```css
.vapor-scan {
  position: absolute;
  inset-inline: 0;
  height: 140px;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    transparent 0%,
    hsl(var(--anno-exceptional) / 0.00) 15%,
    hsl(var(--anno-exceptional) / 0.10) 50%,
    hsl(var(--anno-exceptional) / 0.00) 85%,
    transparent 100%
  );
  filter: blur(14px);
  mix-blend-mode: plus-lighter; /* preserves dark text; additive on light bg */
  will-change: transform, opacity;
  opacity: 0.85;
}
```

Motion:
- Position `y` driven by `motion/react` `useMotionValue`, mapped from overall progress (0 → 1 maps to `-140px` → `editorHeight`).
- On each layer completion, spring-settle briefly at the paragraph roughly corresponding to progress (feels like it "pauses to think"): `{ stiffness: 120, damping: 22 }`.
- Secondary **idle drift** of ±8px on a 2.4s sine oscillation (overlaid via `y` offset) — prevents the "stuck" feeling when a long layer (L3/L5) is mid-run.
- Opacity: 0 on mount, 0.85 on trigger (fade in 240ms ease-out), back to 0 on completion (fade 320ms ease-in, overlapped with paragraph-bloom from §2.2).

Paragraph-bloom (when L3.5 completes): reuses §14 spec. Tint `background-color` from transparent to `hsl(var(--anno-tier-bg))`, 200ms ease-out, staggered 50ms per paragraph, left-to-right. Simultaneously, vapor scan fades out.

All motion respects `prefers-reduced-motion: reduce` — vapor scan collapses to a static thin horizontal line at the progress position, no drift, no bloom; paragraph tints cross-fade without stagger.

### 2.5 Fast-Path Behavior

**Recommendation: minimum 600ms display time, but never fake delay beyond that.**

Focused re-analysis takes 2–3s typical, occasionally <1s (cache hits, ripple-free edits). If we show-hide the loading state in <400ms, motion is illegible — the scan bar appears and vanishes, ribbon blinks, it looks like a bug or glitch. Users have reported "did it even do anything?" after sub-second feedback in similar tools.

**Spec:**
- On trigger, record `t_start`.
- On completion, compute `elapsed = now - t_start`.
- If `elapsed < 600ms`, delay transition-to-results until `t_start + 600ms`.
- During the artificial tail, vapor scan holds at its final position, ribbon fills dots in rapid succession (50ms stagger), caption cycles through whatever layers actually ran — but only the *changed* ones (focused mode often skips L1/L2). Caption shows **"Updating affected paragraphs…"** as a single string instead of layer-by-layer.
- Above 600ms, no artificial delay. Pipeline is fast; let it be fast.

This is not "fake thinking." It's **motion legibility**. Sub-600ms state changes are imperceptible as state changes; they read as flicker.

### 2.6 Slow-Path Anxiety Mitigation

Anxiety curve measured in similar tools: calm 0–10s, mild concern 10–15s, spike at 15s, panic at 20s+. Our 95th-percentile is ~20s; outliers may hit 30s.

**Tiered messaging that swaps the caption region:**

| Elapsed | Behavior |
|---|---|
| 0–12s | Standard layer captions (§2.1). |
| 12–18s | If still mid-layer, caption appends **"(this one takes longer — it's the deep read)"** in lighter weight. Shown once per layer max. |
| 18–25s | Ribbon caption swaps to **reassurance mode**: "Still working. Long essays take a bit more thought. You can cancel if you'd like." Cancel link appears inline under the caption. |
| 25s+ | Caption becomes **"This is taking longer than expected. We'll keep going — or you can cancel and try again."** Cancel button promoted from ghost to outlined. An informational glyph (not warning) appears; tooltip: "No credits charged if analysis doesn't complete." |
| 45s (hard ceiling) | Auto-cancel, route to failure flow (§2.7, timeout variant). |

**No time-remaining ETA.** Reason: our variance is too high (8–30s). A countdown that's wrong is worse than no countdown. A range ("10–20s") is wrong 40% of the time and student-grade users read it as a promise.

**No distraction content** (no tips carousel, no animations of essays being analyzed, no "did you know"). Rationale: the vapor scan + prose caption *is* the distraction; layered entertainment fights it and signals "we know this is taking too long." Respect the wait.

### 2.7 Failure Handling

Four failure classes; distinct UX each.

**(a) Transient API error / network blip** (retriable, ≤2 attempts server-side):
- User sees no change; progress pauses at current layer for up to 4s while server retries.
- If retry succeeds, silent recovery.
- If retry fails, surface as (b).

**(b) Hard failure before any layer completed:**
- Vapor scan fades; ribbon collapses to a single amber dot.
- Modal (glass card, centered over editor, `backdrop-blur-xl` + `bg-background/80`):
  - Title: **"Analysis couldn't finish"**
  - Body: **"Something went wrong on our end. Your essay is safe — nothing was saved or charged."**
  - Buttons: `Try again` (primary) / `Back to editing` (ghost).
- Credits: **fully refunded**. Atomic deduction is reversed at failure boundary.

**(c) Partial failure** (e.g., L3 and L3.5 succeeded, L5 annotation-writing failed):
- Scan bar and ribbon complete normally through the successful layers.
- At L5 failure point, modal:
  - Title: **"We got most of the way"**
  - Body: **"Understanding and judgment finished. The detailed annotations failed to generate. You can see paragraph-level scores, but sentence-level coaching isn't ready."**
  - Buttons: `Show what we have` (primary, reveals paragraph tints + disables sentence click) / `Retry just the annotations` (secondary, re-runs L5 only at ~40% the credit cost — costed as partial) / `Refund and re-edit` (ghost, full refund, editor unlocks).
- Credits: charged **proportionally** to layers completed. Default policy: if L5 fails, charge 60% (the L1–L3.5 cost); if L3.5 fails, charge 30%; if anything before L3 fails, refund fully.

**(d) Rate limit:**
- Modal:
  - Title: **"Too many analyses right now"**
  - Body: **"We're at capacity. Wait about 30 seconds and try again — we won't charge for this attempt."**
  - Auto-retry countdown, 30s, with visible timer. Single `Retry now` button disabled until timer expires.
- Credits: not charged.

All failure modals preserve the editor's current state; no data loss under any path.

### 2.8 Transition to Results

The seam between Phase 4 and Phase 5 is the most emotionally loaded moment. Choreography:

1. **L5 completes.** Server emits `complete` event with full annotation payload.
2. **Vapor scan** fades out over 320ms (ease-in), last position held.
3. **Paragraph tints** bloom in (200ms each, 50ms stagger, left-to-right) — now updated with final L3.5 scores if they shifted during L5.
4. **Ribbon** fills remaining dots rapidly (50ms stagger), caption switches to **"Ready."** for 400ms, then ribbon collapses into the toolbar's analyze-again button (morph: dots merge into a single pill, 300ms spring).
5. **Detail panel** slides in from right (250ms ease-out, §14). First-load shows empty "Click any sentence" state — see Phase 5 spec for the orientation overlay.
6. **Editor unlock:** `editor.setEditable(true)`. Cursor restored to its pre-analysis position.
7. **Sentence underlines and gutter badges** fade in last (200ms, 30ms stagger per paragraph) — deliberately slower so the student's eye settles on paragraph-level shape first.

Total transition duration: ~1.1s from L5-complete to interactive. The student shouldn't feel a hard "ta-da" — it's a tide coming in, not a curtain lifting.

Phase 5 owns first-interaction guidance. Phase 4's only job at the seam is: calm, clean hand-off with cursor preserved.

### 2.9 Cancellation

Always available. Three placements:
- Ribbon hover → `Cancel` link appears inline-right (opacity 0 → 1 on hover, 120ms).
- Keyboard: `Esc` during analysis.
- Slow-path reassurance captions (§2.6) surface cancel inline.

**Cancel flow:**
- Confirm dialog only if >10s elapsed (sunk-cost framing): **"Cancel analysis? You won't be charged. We'll keep your essay as it is."** Buttons: `Keep editing` (primary) / `Keep waiting` (ghost).
- Under 10s elapsed: immediate cancel, no confirm.
- Server: on cancel, abort in-flight layer, discard partial results.
- **Credits: fully refunded.** No partial-results-from-cancel is ever persisted. Cancellation is binary: you aborted, you pay nothing, you see nothing new.
- Editor unlocks immediately, cursor restored, toast confirms: **"Analysis canceled. Pick up where you left off."** (4s auto-dismiss.)

Rationale for always-full-refund on cancel: students who feel trapped by sunk cost won't cancel, will sit through a bad run, and will blame us. Free cancellation is cheap insurance against that.

### 2.10 Returning Mid-Analysis

Scenarios: tab close, browser crash, navigate away, come back 2 min / 2 days later.

**Recommendation: server-side analysis continues; on return we reconcile.**

- Analysis job is persisted server-side with a job ID keyed to user + essay + snapshot hash.
- If they close the tab mid-run, the job continues to completion on the backend and results are stored.
- On return:
  - **If job still running** (<60s since trigger, still live): reconnect SSE stream, resume ribbon at current layer. Editor re-enters soft-lock. Short toast: **"Picking up where we left off."**
  - **If job completed while away:** detail panel is pre-populated with results; editor shows annotations; a dismissable banner at the top reads **"Analysis finished while you were away. [View results]"**. Clicking scrolls to first annotated paragraph.
  - **If job failed while away:** same failure modals as §2.7, queued to show on return. Credits already refunded if applicable.
  - **If they edited the essay in another tab between trigger and return** (rare): snapshot hash mismatches on reconnect; results are flagged `stale` (visible via §14's stale-hatch pattern). Offer `Use these anyway` / `Re-analyze current version`.

Job ID lives in URL query param (`?analysis=<id>`) so a refresh reconnects; also in localStorage as fallback.

---

## 3. Motion & Timing Spec

| Element | Duration | Easing | Trigger |
|---|---|---|---|
| Vapor scan fade-in | 240ms | ease-out (cubic 0.16, 1, 0.3, 1) | Analyze clicked |
| Vapor scan drift (per-layer settle) | spring | `{ stiffness: 120, damping: 22 }` | Layer-complete SSE event |
| Vapor scan idle oscillation | 2.4s loop | sine | Continuous during active layer |
| Vapor scan fade-out | 320ms | ease-in | L5 complete |
| Ribbon dot active → done | 180ms | ease-out | Layer-complete SSE |
| Ribbon dot pulse (active) | 1.5s loop | ease-in-out | While layer active |
| Caption swap (out) | 120ms | ease-in | Layer transition |
| Caption swap (in) | 180ms | ease-out + 2px Y | Layer transition |
| Paragraph tint bloom | 200ms each, 50ms stagger, L→R | ease-out | L3.5 complete |
| Sentence underline fade | 200ms, 30ms stagger | ease-out | L5 complete (post-bloom) |
| Detail panel slide-in | 250ms | ease-out | L5 complete (parallel) |
| Editor lock transition (no visual) | instant | — | Analyze clicked |
| Interception toast slide-in | 220ms | ease-out | Keypress during lock |
| Cancel confirm dialog | 180ms fade + 8px Y | ease-out | Cancel after 10s |
| Failure modal | 200ms fade + 4px Y | ease-out | Failure event |
| Ribbon → analyze-pill morph | 300ms | spring { stiffness: 140, damping: 18 } | Transition end |
| Reduced-motion: all above | instant or ≤80ms crossfade | linear | — |

---

## 4. Copy Deck

Every user-facing string in Phase 4, numbered for reference.

**Ribbon captions (layer-active):**

1. *"Reading the essay…"* — L1. Simple, honest first impression.
2. *"Mapping the structure…"* — L2. Uses essay-class vocabulary ("structure").
3. *"Tracing connections across paragraphs…"* — L2.5. Shows whole-essay view.
4. *"Walking through sentence by sentence…"* — L3. The deliberately slow-sounding one. Builds trust by naming depth.
5. *"Hearing your voice…"* — L3.75. Emotional anchor. Most important string in the set.
6. *"Judging what's working…"* — L3.5. Frames understanding → judgment explicitly.
7. *"Writing your annotations…"* — L5. Possessive pronoun. These are yours.
8. *"Ready."* — Final-state caption (400ms). Terminal.

**Caption modifiers (slow path):**

9. *"(this one takes longer — it's the deep read)"* — appears appended to #4 or #5 after 12s in that layer. Lowercase parens = secondary info.
10. *"Still working. Long essays take a bit more thought. You can cancel if you'd like."* — 18–25s reassurance. "A bit more thought" anthropomorphizes charitably.
11. *"This is taking longer than expected. We'll keep going — or you can cancel and try again."* — 25s+ harder acknowledgment.
12. *"No credits charged if analysis doesn't complete."* — tooltip on the 25s+ info glyph. Explicit financial safety.

**Fast-path caption:**

13. *"Updating affected paragraphs…"* — focused re-analysis. Uses "affected" to signal surgical, not full re-do.

**Edit-attempt interception:**

14. *"Analysis in progress. Cancel to keep editing, or wait about 15 seconds."* — inline toast on keypress during soft-lock. "About 15 seconds" is calibrated to median, not worst case, because most attempts are in the early window.

**Cancellation:**

15. *"Cancel analysis? You won't be charged. We'll keep your essay as it is."* — >10s confirm dialog. Two reassurances (no charge, no data loss).
16. Button: *"Keep editing"* (primary cancel-confirm).
17. Button: *"Keep waiting"* (stay in analysis).
18. Toast after cancel: *"Analysis canceled. Pick up where you left off."*

**Failure — hard failure before L1 completes:**

19. Title: *"Analysis couldn't finish"* — agentless, non-blaming.
20. Body: *"Something went wrong on our end. Your essay is safe — nothing was saved or charged."* — owns the problem, reassures on data + money.
21. Button: *"Try again"* (primary).
22. Button: *"Back to editing"* (ghost).

**Failure — partial (L5 failed):**

23. Title: *"We got most of the way"* — honest, not triumphant.
24. Body: *"Understanding and judgment finished. The detailed annotations failed to generate. You can see paragraph-level scores, but sentence-level coaching isn't ready."* — precise about what worked / didn't.
25. Button: *"Show what we have"* (primary).
26. Button: *"Retry just the annotations"* (secondary).
27. Button: *"Refund and re-edit"* (ghost).

**Failure — rate limit:**

28. Title: *"Too many analyses right now"* — system state, not user fault.
29. Body: *"We're at capacity. Wait about 30 seconds and try again — we won't charge for this attempt."*
30. Button: *"Retry now"* (disabled until countdown ends).

**Returning mid-analysis:**

31. Toast on reconnect-live: *"Picking up where we left off."*
32. Banner on reconnect-completed: *"Analysis finished while you were away."* with link *"View results"*.
33. Stale-results prompt: *"Your essay changed since this analysis ran. Use these results anyway, or re-analyze?"* with buttons *"Use these"* / *"Re-analyze current version"*.

All copy: sentence case, no exclamation marks, no "Oops!", no "Awesome!". Tone: a calm tutor.

---

## 5. Mobile Adaptations

On <768px (Wave 1 plan §15 Mobile):

- **Ribbon:** collapses to 7 tiny dots (4px, 1px gap) and **no connecting hairline**; caption sits underneath on its own line rather than inline. Total toolbar height grows by 22px during analysis.
- **Vapor scan:** reduced to height 80px, blur 10px, opacity 0.7 — less visible on small screens but still signals motion. No idle drift (battery).
- **Soft-lock toast:** bottom-sheet instead of top-toast (thumb reach).
- **Cancel access:** always-visible `X` icon at the right edge of the ribbon on mobile (no hover state to discover).
- **Failure modals:** full-screen sheets, not centered glass cards.
- **Paragraph bloom:** all paragraphs reveal simultaneously on L3.5 complete (no left-to-right stagger — too slow cumulatively on small viewports where there are many short paragraphs).
- **Detail panel transition:** not applicable in mobile (panel is a full-screen sheet opened on-demand in Phase 5).
- **Slow-path reassurance:** appears as a toast that persists (not auto-dismissed) rather than inline caption addition.

Reduced-motion variants (§3) apply on top of all of the above.

---

## 6. Backend Requirements

**Recommendation: Server-Sent Events (SSE), not WebSocket, not polling.**

Why SSE:
- One-way server-to-client stream fits the pipeline exactly (client sends trigger REST, receives progress stream). No client→server messages mid-stream needed.
- Native `EventSource` browser API; no library; works through most corporate proxies.
- Automatic reconnection on transient network blips.
- Cheap at our scale. WebSocket's bidirectional channel is wasted here; polling is chatty and laggy.

**Endpoints:**

```
POST /api/analysis/trigger
  body: { essayId, snapshot, mode: 'full' | 'focused' }
  returns: { analysisId, streamUrl }

GET /api/analysis/stream/:analysisId   (SSE)
  events: 'layer_start' | 'layer_complete' | 'complete' | 'error' | 'partial_failure'

POST /api/analysis/cancel/:analysisId
  returns: { refunded: boolean, creditsReturned: number }

GET /api/analysis/status/:analysisId
  (for mid-analysis return — returns current state if job is still live,
   or final results / failure if completed while away)
```

**SSE event payload shapes:**

```ts
// layer_start — marks a layer entering active state
{ type: 'layer_start', layer: 'L1' | 'L2' | 'L2.5' | 'L3' | 'L3.75' | 'L3.5' | 'L4' | 'L5',
  timestampMs: number }

// layer_complete — ribbon dot fills; may carry intermediate results
{ type: 'layer_complete', layer: LayerId, timestampMs: number,
  intermediateResult?: { /* only for L3.5 — paragraph tier scores for early bloom */ } }

// complete — full payload; triggers reveal
{ type: 'complete', timestampMs: number, result: FullAnalysisResult }

// partial_failure — one layer failed after earlier success
{ type: 'partial_failure', failedLayer: LayerId, completedLayers: LayerId[],
  partialResult: PartialAnalysisResult, refundFraction: 0 | 0.4 | 0.7 | 1.0 }

// error — hard failure
{ type: 'error', errorClass: 'transient' | 'hard' | 'rate_limit' | 'timeout',
  message: string, retryable: boolean }

// heartbeat — every 3s so the client knows the stream is alive
{ type: 'heartbeat', timestampMs: number }
```

**Guarantees the backend must provide:**
- Heartbeat every 3s (client treats 6s-silence as disconnect → reconnect).
- `layer_complete` events fire strictly in dependency order (L1 → L2 → L2.5 → L3 → L3.75 → L3.5 → L4 → L5). L3.5 receives L3.75 output; client should not expect L3.5 before L3.75.
- Each `analysisId` is idempotent — re-POSTing `trigger` with the same snapshot within 60s returns the existing `analysisId`.
- Cancel is idempotent and always safe — returns `refunded: true` if cancelled before any billable checkpoint.

**Billing checkpoints** (server-side): credits are authorized on trigger, committed at L5 complete. On cancel/failure before commit, authorization is released. Partial-failure commits the `refundFraction` complement.

---

## 7. Emotional Journey Map

Second-by-second, an anxious 17-year-old's internal monologue — and what the UI delivers.

| t | Student feels | UI delivers |
|---|---|---|
| 0s | "Here we go." Click. | Soft-lock engages silently; vapor scan fades in (240ms); ribbon replaces CTA; first caption appears. |
| 1s | "It's doing something." | Ribbon L1 dot pulses; caption *"Reading the essay…"*; scan begins top of essay. |
| 2s | "Oh, L1 done, cool." | L1 dot turns green; caption swaps to *"Mapping the structure…"*. |
| 3–4s | "This feels real." | L2 fills; *"Tracing connections across paragraphs…"*. Scan drifting smoothly. |
| 5–7s | "Okay long-ish now." | L3 active — *"Walking through sentence by sentence…"* — the deliberately slow one. Scan settles mid-essay. |
| 7–9s | Peak curiosity: "What will it say?" | Caption swaps to *"Hearing your voice…"* — emotional peak for the student. Scan settles low. |
| 9–11s | "Almost there?" | L3.5 active: *"Judging what's working…"*. Paragraph tints begin blooming L→R. First semantic feedback appears. |
| 11–14s | "I can see the shape already." | Paragraphs now tinted; scan near bottom. L5 active: *"Writing your annotations…"*. |
| 14–17s | Mild impatience. | Scan idles at bottom with gentle drift; dot 7 pulsing. |
| 17s (median) | "Oh!" | Transition: scan fades, sentence underlines bloom, panel slides in, *"Ready."* → morphs to analyze-pill. |
| 17s+ (slow path) | "Is it stuck?" | Caption acknowledges: *"(this one takes longer — it's the deep read)"*. Scan still drifting. |
| 20s+ | Anxiety: "Did it break?" | Reassurance caption; cancel surfaced inline. |
| 25s+ | "I should cancel." | Cancel button promoted; credit-safety tooltip visible. |
| On reveal | "Did it *see* me?" (Phase 5 owns this.) | — |

The emotional high note is **"Hearing your voice…"** at ~7–9s. Landing the voice caption before frustration sets in is the single most important timing target in Phase 4.

---

## 8. Open Questions / Decisions Deferred

1. **Sound design.** Wave 1 §14 mentions optional sound for celebrations. Should the L5-complete transition play a subtle chime? Recommend: off by default, togglable in settings, never during Phase 4 itself — only at the Phase 5 seam.
2. **Accessibility announcements.** Exact `aria-live` cadence for screen readers: we want layer captions announced but not every heartbeat. Recommend polite region with `aria-atomic=true` and a debounced update (max once per 1500ms), announcing caption text only. Needs screen-reader user testing before lock-in.
3. **Telemetry.** Which metrics to log from Phase 4? Minimum: `trigger_to_L5_ms`, `layer_duration_ms[layer]`, `cancel_at_ms`, `cancel_reason`, `failure_class`, `edit_attempt_during_lock_count`. Deferred to analytics spec.
4. **Preview mode / demo.** For first-time users or marketing, do we support a canned-analysis mode that plays the loading choreography on a fixed essay without API calls? Potentially useful, deferred.
5. **Ultra-slow recovery (45–90s).** Currently hard-cancel at 45s. Is there a "background completion" option where the analysis keeps running server-side and emails/notifies when done? Probably yes for power users; deferred to a later wave.
6. **Snapshot-hash drift policy.** Exact byte-level vs semantic hashing of the essay snapshot for the "stale on return" check — TipTap doc JSON vs plain-text vs structural hash. Engineering decision, not UX.
7. **Credit refund fractions for partial failure.** Current proposal is 0/30/60/100%. Product/finance should confirm the 60% figure aligns with actual per-layer cost ratios.
8. **Ribbon-morph destination.** Does the post-analysis ribbon morph into a "Re-analyze" button or collapse entirely into a subtle "analyzed ✓" state? Defer to Phase 5 spec which owns post-analysis toolbar.
