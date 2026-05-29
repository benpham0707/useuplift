# UX Phase Deep-Dive Prompts

> **How to use**: Run one chat per phase in the execution order below. Each phase produces a deliverable document. Later phases reference earlier deliverables. Paste the SHARED CONTEXT block + the specific PHASE PROMPT into each chat.

---

## Execution Order (8 Waves)

```
WAVE 1 (parallel — no dependencies):
  Phase 1: Empty State & First Landing
  Phase 2: First Draft Writing Experience
  Phase 3: Analysis Trigger Decision

WAVE 2 (sequential — depends on Wave 1):
  Phase 4: Analysis Loading State
  Phase 5: First Results Reveal
  Phase 6: First-Time Orientation

WAVE 3 (sequential — depends on Wave 2):
  Phase 7: Sentence Click → Panel Open
  Phase 8: Reading & Processing Insights
  Phase 9: Rewrite Suggestion Experience
  Phase 10: Navigation Between Annotations
  Phase 11: Annotation List / Map View

WAVE 4 (sequential — depends on Wave 3):
  Phase 12: Making the First Edit
  Phase 13: Stale State & Re-analysis Decision
  Phase 14: The Red→Green Moment
  Phase 15: Iteration Loop Pacing

WAVE 5 (parallel with Wave 4 — depends on Wave 3):
  Phase 16: Profile Tab Deep Dive
  Phase 17: Connection Discovery
  Phase 18: Paragraph-Level Zoom
  Phase 19: Essay-Level Overview

WAVE 6 (depends on Waves 4+5):
  Phase 20: Phase Transitions
  Phase 21: Filter & Focus Modes
  Phase 22: Strength vs Problem Balance

WAVE 7 (depends on Wave 3):
  Phase 23: Coaching Bar Integration
  Phase 24: Contextual Smart Prompts

WAVE 8 (depends on all):
  Phase 25: Return Visit & Re-entry
  Phase 26: Near-Completion Polish
  Phase 27: The "Ready" Signal
```

---

## SHARED CONTEXT BLOCK

> **Paste this at the start of EVERY phase chat.**

```
=== SHARED CONTEXT: Uplift Inline Annotation Editor ===

PRODUCT: Uplift is an AI-powered college application essay platform. Students write essays (Common App 650 words, PIQ 350 words, supplements vary), and our system analyzes them using an 8-layer AI pipeline that builds a deep semantic profile of every sentence and paragraph.

THE NEW EXPERIENCE: We're building an inline annotation editor — a Word-doc-like editing experience where the essay text itself IS the interface. Every sentence carries a color-coded annotation based on our analysis. Students click sentences to see insights, profiles, and connections. The goal: no more context switching between writing and reading feedback.

BACKEND (Essay Intelligence Pipeline):
- L1 (Haiku): First impressions — quick per-paragraph observations
- L2 (Sonnet): Structural cartography — bird's-eye structural map
- L2.5 (Haiku): Connection scout — cross-paragraph surface connections
- L3 (Sonnet): Understanding walk — deep sentence-level semantic mapping (THE CORE)
- L3.75 (Sonnet): Holistic synthesis — 10 sections (voice identity, voice map, emotional topography, earned-ness map, thematic architecture, narrative strategy, character revelation, craft assessment, admissions positioning, entanglements)
- L3.5 (Sonnet): Analysis pass — per-sentence effectiveness scores (0-100), strengths, weaknesses
- L4 (Sonnet): Crystallization — North Star (through-line, structural roles, distinctiveness)
- L5 (Sonnet): Deep annotations — teaching feedback with causal chains, rewrite examples
- L6 (Sonnet): Coaching — multi-turn conversation, pattern detection, phase-aware responses

PROFILE STRUCTURE (what the backend produces per sentence):
- Understanding: observedFunctions[], inferredIntents[], narrativeContributions[], craft details, significantChoices[]
- Analysis: effectiveness (0-100), isStrength, isProblem, priorityForImprovement (0-5), strengths[], weaknesses[]
- Connections: links to other sentences (thematic echo, earned moment, voice shift, etc.)

COLOR SYSTEM (6 tiers from L3.5 effectiveness scores):
- CRITICAL (Red, <40): Actively harms the essay
- NEEDS WORK (Amber, 40-54): Weak but functional
- FUNCTIONAL (Sage, 55-75): Gets the job done — no visual noise
- STRONG (Green, 76-85): Genuinely strong writing
- EXCEPTIONAL (Teal, 86-95): Distinctive, memorable
- MASTERFUL (Purple, 96-100): System can't suggest improvements

DETAIL PANEL (right side, two tabs):
- Insights tab (default): L5 teaching feedback — critique/praise, why it matters, rewrite suggestion
- Profile tab: L3 understanding — what the sentence does, writer's intent, craft details, significant words

IMPROVEMENT PHASES (from ProfileIndex):
- Foundation: Essay-level coaching (establish through-line)
- Architecture: Paragraph-level coaching (transitions, structure)
- Craft: Sentence-level coaching (word choice, specificity)
- Polish: Word-level coaching (precision, rhythm)
- Distinction: Memorability coaching (push distinctive moments)

EDITOR: TipTap (ProseMirror-based) with decoration plugin for non-destructive annotation overlays.

LAYOUT: Split panel — editor (60%) left, detail panel (40%) right. Coaching bar collapsible at bottom.

STUDENTS: High school juniors/seniors (16-18), varying writing ability, often anxious about college apps. Many have never received granular writing feedback before. The experience must feel supportive, not judgmental.

TARGET ESSAY SIZES: Common App (650 words, ~5-7 paragraphs, ~25-40 sentences), PIQ (350 words, ~3-4 paragraphs), supplements (150-400 words).

COST PER ANALYSIS: Full first pass ~$0.50-1.00, focused re-analysis ~$0.02-0.10.

ANALYSIS TIME: Full first pass ~8-20 seconds, focused re-analysis ~2-5 seconds.

DESIGN LANGUAGE: Glass morphism / vapor aesthetic. Subtle, modern, not overwhelming. Consistent with existing component library (shadcn/ui + Tailwind + motion/react).

=== END SHARED CONTEXT ===
```

---

## PHASE PROMPTS

---

### PHASE 1: Empty State & First Landing

```
=== PHASE 1: EMPTY STATE & FIRST LANDING ===

You are a senior UX designer specializing in writing tools and educational software. Your task is to design the complete experience for when a student first arrives at the annotation editor with NO essay written yet.

This is the FIRST THING they see. It sets the emotional tone for the entire product experience. Get this wrong and they feel intimidated or confused. Get this right and they feel invited, supported, and excited to write.

CONTEXT FROM PRIOR PHASES: None — this is Wave 1.

DEEP DIVE QUESTIONS TO ANSWER:

1. THE BLANK CANVAS
   - What does the empty editor look like? Just a blinking cursor? A faint prompt question reminder? A subtle background pattern?
   - How do we make a blank page feel inviting rather than intimidating?
   - Is the annotation system visible at all before text exists? (Gutter, toolbar, panel — are they present but empty, or completely hidden?)
   - What's the visual hierarchy? Should the editor be full-width when there's no panel content?

2. THE PROMPT/QUESTION CONTEXT
   - Students are responding to a specific prompt (e.g., Common App: "Share your story"). Should the prompt be visible in/above the editor?
   - If visible, should it be dismissible? Persistent? Collapsible?
   - Does showing the prompt help focus them, or add pressure?
   - What about word count limits — shown from the start or only after they start typing?

3. WRITING GUIDANCE (PRE-ANALYSIS)
   - Should there be any guidance before they start writing? "Tips for getting started"? Or is that patronizing?
   - What about placeholder text? "Start writing your essay..." vs nothing vs a more creative prompt?
   - Do we offer a "brainstorm mode" or "outline mode" before they commit to writing?
   - Should we show examples of strong openings (dangerous — could bias their writing)?

4. THE ANNOTATION SYSTEM PRESENCE
   - When should the toolbar, gutter, and panel first appear?
   - Option A: Hidden until first analysis — clean writing experience first
   - Option B: Present but grayed out — student knows analysis exists and anticipates it
   - Option C: Present with a "Get feedback" call-to-action — student knows it's one click away
   - Which approach creates the best anticipation without distraction?

5. ESSAY TYPE AWARENESS
   - Common App (650 words) vs PIQ (350 words) vs Supplements (150-400 words) — different empty states?
   - Should the empty state adapt to essay type? (Different prompt display, different word targets)
   - Should we communicate the scope of analysis they'll receive?

6. PASTE vs WRITE
   - Many students draft in Google Docs and paste into our editor. How do we handle paste?
   - Should there be a "Paste your essay" button alongside the blank editor?
   - If they paste 650 words at once, do we immediately offer analysis? Or let them review first?
   - How does paste interact with the empty state → first writing experience transition?

7. EMOTIONAL DESIGN
   - What emotions should the empty state evoke? (Calm, excited, focused, curious?)
   - Color palette for the empty state — warm? Cool? Neutral?
   - Should there be any animation or movement? (Too much = distracting, too little = static/dead)
   - Sound design? (Probably not, but consider keyboard sounds for a satisfying typing experience)

8. MOBILE EMPTY STATE
   - How does this adapt to tablet/phone? (Same principles, different layout)
   - Is writing on mobile a primary or secondary use case?

DELIVERABLE: A comprehensive UX specification for the empty state that includes:
- Visual mockup description (layout, elements, colors, typography)
- Copy/microcopy for all text elements
- Behavior specification (what happens when they type the first character, first sentence, first paragraph)
- Transition plan: how does the empty state evolve as they write? At what word count do elements appear/change?
- Design rationale for every decision (why this, not that)
- Edge cases: paste, mobile, returning to delete all text, switching essay types
- Backend requirements: what data does the frontend need from the backend at this stage?
- Emotional journey map: what should the student FEEL at each micro-moment of this phase
```

---

### PHASE 2: First Draft Writing Experience (Pre-Analysis)

```
=== PHASE 2: FIRST DRAFT WRITING EXPERIENCE (PRE-ANALYSIS) ===

You are a senior UX designer specializing in writing tools. Your task is to design the complete writing experience BEFORE any analysis has been triggered. The student is drafting their essay — what does the editor feel like?

This phase is about the WRITING experience, not the feedback experience. The student is creating, not evaluating. The environment must serve creativity and flow state.

CONTEXT FROM PRIOR PHASES: Reference Phase 1 (Empty State) deliverable for how the editor starts.

DEEP DIVE QUESTIONS TO ANSWER:

1. EDITOR FEEL & TYPING EXPERIENCE
   - What does typing feel like? Smooth, responsive, satisfying? What font? What line height? What margins?
   - TipTap gives us control over the editing experience — what customizations make essay writing feel premium?
   - Paragraph spacing: visual separation between paragraphs? Subtle dividers? Just whitespace?
   - Should we show paragraph numbers in the gutter? (Useful for later analysis reference, but cluttering during writing)

2. PROGRESSIVE ELEMENT REVELATION
   - As they write, when do UI elements appear?
   - Word count indicator: visible from first character? After 50 words? Always present but subtle?
   - Word count format: "127 / 650 words" or "127 words" or just "127"? Progress bar? Color change near limit?
   - Paragraph count: shown? Useful for structural awareness but potentially distracting.

3. WRITING ASSISTANCE (WITHOUT AI ANALYSIS)
   - Do we offer ANY real-time help? Spell check? Grammar hints? Or is that scope creep?
   - What about basic writing hygiene: very long paragraphs (>150 words), very short paragraphs (<20 words)?
   - Should we gently flag structural observations? "You've been writing one paragraph for 200 words — consider breaking it up"
   - Or is ALL intelligence deferred until they trigger analysis? (Cleaner, but misses easy wins)

4. SAVE & PERSISTENCE
   - Auto-save behavior: every keystroke? Every 5 seconds? On blur? Visual indicator?
   - "Saved" indicator: where? How subtle? Does it appear and fade, or persist?
   - What if they close the tab accidentally? Recovery experience?
   - Draft versioning: can they see/recover previous drafts? (Not MVP, but plan the hook)

5. FORMATTING CONTROLS
   - Essays are plain text — no bold, italic, headers. But students may expect formatting.
   - If they try to bold text, what happens? Silently ignore? Gentle tooltip explaining essays are plain text?
   - Copy-paste with formatting: strip formatting silently? Show a "formatting removed" notice?

6. DISTRACTION-FREE MODE
   - Should there be a "focus mode" that hides even the toolbar/nav? Full-screen writing?
   - Or is the default experience already distraction-free enough?
   - How does the annotation system presence (toolbar, panel space) affect writing focus?

7. THE "ANALYSIS AVAILABLE" MOMENT
   - At what point do we suggest they can get analysis? After 100 words? After they pause for 10 seconds?
   - How do we communicate "analysis is available" without interrupting their flow?
   - Is it a button that appears? A gentle glow on the toolbar? A tooltip on first pause?
   - What if they've written 3 paragraphs and never triggered analysis — do we nudge?

8. THE TRANSITION TO ANALYSIS
   - The moment between "I'm writing" and "I want feedback" is a mode shift. How do we design this transition?
   - Does the writing experience need to change at all for the analysis experience?
   - Or do they coexist naturally — writing continues, annotations just appear around the text?

9. PASTE-IN EXPERIENCE
   - Student pastes 650 words from Google Docs. The editor goes from empty to full instantly.
   - What's the UX of that moment? Does the text appear all at once? Paragraph by paragraph?
   - After paste: do we immediately surface "Analyze your essay?" or let them review/edit first?
   - What about paste with weird formatting (double line breaks, tab characters, smart quotes)?

10. EMOTIONAL ARC OF WRITING
    - The emotional journey of writing a college essay: anxiety → flow → doubt → satisfaction → anxiety about submitting
    - How does the editor environment support each phase?
    - When they're struggling (long pauses, lots of deleting), should the system notice? Offer encouragement?
    - Or is silence the best support during writing?

DELIVERABLE: A comprehensive UX specification for the pre-analysis writing experience that includes:
- Editor styling specification (font, size, spacing, margins, colors)
- Progressive element revelation timeline (what appears when)
- Word count / progress indicator design
- Auto-save behavior and visual feedback
- Paste handling specification
- The "analysis available" trigger UX
- Copy/microcopy for all text elements
- Keyboard shortcuts during writing
- Mobile writing adaptations
- Backend requirements: what does the frontend need from the backend during writing? (Save endpoint, essay type info, word limits)
- Emotional journey map for the writing phase
```

---

### PHASE 3: Analysis Trigger Decision

```
=== PHASE 3: THE ANALYSIS TRIGGER — WHEN & HOW ===

You are a senior UX designer specializing in AI-powered tools. Your task is to design the decision point where a student decides to trigger analysis of their essay. This is the bridge between writing and feedback.

This decision has cascading implications: trigger too early → incomplete/misleading analysis. Trigger too late → student wrote blind for too long. Auto-trigger → loss of agency. Manual trigger → friction.

CONTEXT FROM PRIOR PHASES: Reference Phase 1 (Empty State) and Phase 2 (Writing Experience) deliverables.

DEEP DIVE QUESTIONS TO ANSWER:

1. MANUAL vs AUTO vs HYBRID
   - Option A: Manual only — student clicks "Analyze" when ready. Maximum control, but requires awareness.
   - Option B: Auto-trigger after pause — system detects they've stopped typing for 10+ seconds and asks "Ready for feedback?" Not auto-analyzing but surfacing the option.
   - Option C: Auto-analyze after each paragraph — always analyzing in the background, showing results as they arrive.
   - Option D: Hybrid — manual trigger, but smart nudges when analysis would be valuable.
   - Which approach respects student agency while minimizing friction?
   - What about the cost implications? Auto-analyzing burns credits. Manual gives cost control.

2. MINIMUM VIABLE TEXT
   - What's the minimum text for useful analysis? One paragraph? Three sentences? 100 words?
   - If they try to analyze too little text, what happens? Block? Warn? Analyze with caveats?
   - Should the analyze button be disabled until minimum is met? Or always available with a warning?

3. THE ANALYZE BUTTON/CTA DESIGN
   - Where does it live? Toolbar? Floating? Inline at the end of the essay?
   - What does it say? "Analyze" / "Get Feedback" / "Review My Essay" / something else?
   - Visual design: prominent enough to find, subtle enough not to pressure.
   - Does it pulse/glow when conditions are right? (Enough text, paused writing)
   - After first analysis: does the button change to "Re-analyze" with different styling?

4. PARTIAL vs FULL ANALYSIS
   - Should students be able to analyze a single paragraph? Or always the full essay?
   - "Analyze this paragraph" — useful for iterative writers who draft paragraph by paragraph.
   - But partial analysis misses cross-paragraph connections, structural understanding.
   - Trade-off: faster + cheaper partial vs richer full. How do we present this choice, if at all?

5. ANALYSIS MODE SELECTION (for experienced users)
   - First-time users: no mode choice. Just "Analyze."
   - Returning users (essay already analyzed, making edits): "Quick check" vs "Full re-analysis"
   - How do we present this choice without overwhelming? Progressive disclosure? Auto-selection with override?

6. THE COST/CREDIT CONVERSATION
   - Each analysis costs credits. When do we communicate cost? Before triggering? Never?
   - "This analysis will use 1 credit" — transparent but adds friction.
   - Or is analysis "included" in the subscription, and we just manage cost internally?
   - If credits are low: warning before analysis? Block? Degrade to cheaper analysis?

7. CONFIRMATION vs INSTANT
   - Does clicking "Analyze" immediately start analysis? Or show a confirmation?
   - Confirmation adds friction but prevents accidental triggers.
   - For first analysis: maybe show a brief "Here's what we'll do" explanation (one-time).
   - For subsequent analyses: instant trigger, no confirmation.

8. ESSAY TEXT SNAPSHOT
   - When analysis triggers, do we snapshot the current text? (So edits during analysis don't cause mismatch)
   - If yes: visual indicator that the analyzed version is "frozen" and current edits are pending
   - If no: how do we handle edits during the 8-20 second analysis window?

9. EDGE CASES
   - Student triggers analysis, then keeps typing — how do annotations align with changed text?
   - Student triggers analysis on 200 words, then pastes 400 more words while analysis is running
   - Student triggers analysis twice rapidly (double-click)
   - Student navigates away during analysis — what happens when they come back?
   - Student triggers analysis on an essay that was already analyzed — full re-analysis or incremental?

10. THE EMOTIONAL MOMENT
    - Clicking "Analyze" is emotionally charged: "What will it say about my writing?"
    - This is a vulnerability moment — they're submitting their creative work for judgment.
    - The CTA copy and surrounding UI should acknowledge this without being heavy-handed.
    - How do we frame analysis as "understanding your essay" rather than "grading your essay"?

DELIVERABLE: A comprehensive decision framework for analysis triggering that includes:
- Trigger mechanism specification (manual/auto/hybrid with full rationale)
- Minimum text requirements and enforcement
- CTA design (placement, copy, visual states)
- Cost/credit communication strategy
- First-time vs returning user flows
- Edge case handling for each scenario
- The snapshot/mismatch problem solution
- Mobile trigger experience
- Backend requirements: what API does the frontend call? What parameters? What response structure?
- Emotional design rationale for every copy choice
```

---

### PHASE 4: Analysis Loading State

```
=== PHASE 4: ANALYSIS LOADING STATE ===

You are a senior UX designer specializing in loading states and perceived performance. Your task is to design the 8-20 second window between triggering analysis and seeing results.

This is an eternity in UX. Users routinely abandon after 3 seconds of waiting. You need to make 8-20 seconds feel purposeful, interesting, and shorter than it is. The loading state IS part of the product experience.

CONTEXT FROM PRIOR PHASES: Reference Phase 3 (Analysis Trigger) for how analysis was initiated. The student has just clicked "Analyze" — now what?

DEEP DIVE QUESTIONS TO ANSWER:

1. PROGRESS COMMUNICATION
   - Do we show which layer is currently running? ("Understanding your voice... Mapping your structure...")
   - Layer-by-layer progress: L1→L2→L2.5→L3→L3.75→L3.5→L4→L5 — too technical? Or fascinating?
   - Human-readable layer descriptions:
     * L1: "Reading your essay..."
     * L2: "Mapping the structure..."
     * L2.5: "Finding connections..."
     * L3: "Understanding each sentence..."
     * L3.5: "Evaluating effectiveness..."
     * L3.75: "Synthesizing the big picture..."
     * L4: "Crystallizing the core..."
     * L5: "Preparing your feedback..."
   - Progress bar, step indicator, or flowing animation?

2. INCREMENTAL RESULTS
   - L1 finishes in ~1-2 seconds. Can we show L1 results immediately while L3 runs?
   - Incremental revelation: L1 gives rough paragraph observations → L3 enriches → L3.5 adds scores
   - Visual: sentences gain annotations progressively as layers complete
   - Risk: showing incomplete data, then replacing it (confusing/jarring)
   - Alternative: show nothing until L3.5, then reveal everything at once with a bloom effect

3. CAN THEY KEEP EDITING?
   - While analysis runs (8-20 seconds), can the student continue editing?
   - Yes: analysis works on a snapshot, edits create a "stale" state — but they're not waiting
   - No: editor is read-only during analysis — clear but frustrating
   - Hybrid: they CAN edit, but we show a gentle overlay noting "Analysis in progress — your edits will be marked for re-analysis"
   - Which approach feels best for a 16-18 year old?

4. ANIMATION & VISUAL DESIGN
   - What does the loading state look like IN the editor? The text is there — what happens to it?
   - Option A: Text stays normal, a progress bar appears in the toolbar
   - Option B: Text gets a subtle shimmer/scan effect (like a scanner passing over it)
   - Option C: Paragraphs get sequential subtle highlights as each is analyzed
   - Option D: A translucent overlay with progress information
   - The animation should feel like "the system is thinking about your essay" — alive, intelligent

5. WHAT IF IT'S FAST?
   - Focused re-analysis takes 2-3 seconds. The loading state might flash too quickly.
   - Minimum display time for the loading state? 1 second? 2 seconds?
   - Or no minimum — if it's fast, just show results immediately (feels magical)

6. WHAT IF IT'S SLOW?
   - Full analysis on a long essay might take 20+ seconds. At 15 seconds, anxiety increases.
   - Do we show time remaining? "Almost done..." messaging?
   - Percentage progress: accurate but jumpy (L3 is 60% of the time, so progress stalls at 30-70%)
   - Or distraction: "Did you know? Admissions officers spend 8-15 minutes on each application" — interesting facts during loading

7. FAILURE HANDLING
   - Analysis fails (API error, timeout, rate limit). What does the student see?
   - "Something went wrong. Try again?" — honest, actionable
   - Retry button with backoff: first retry automatic, second manual
   - Partial failure: L3 succeeds but L3.5 fails — show what we have? Or fail completely?
   - Never: silent failure that leaves them waiting forever

8. THE TRANSITION TO RESULTS
   - Loading finishes. How does the loading state transform into the results state?
   - Option A: Instant switch — loading disappears, colors appear all at once
   - Option B: Bloom effect — colors fade in paragraph by paragraph over 1-2 seconds
   - Option C: The scan animation completes, leaving colors behind as it passes
   - This transition IS the Phase 5 (First Results Reveal) setup — design them as one continuous moment

9. CANCELLATION
   - Can the student cancel analysis mid-run? Should they?
   - "Cancel" button: where? How prominent?
   - If they cancel at 80% progress: do we show partial results? Or discard everything?
   - Does cancellation refund credits?

10. RETURNING DURING ANALYSIS
    - Student triggers analysis, closes the tab, comes back 30 seconds later. Analysis finished.
    - What do they see? Full results? A "Your analysis is ready" message? Results just there?
    - Student triggers analysis, navigates to a different page, comes back. Same question.

DELIVERABLE: A comprehensive loading state specification that includes:
- Progress communication design (visual + copy for each stage)
- Incremental vs batch result revelation decision
- Editing-during-analysis policy
- Animation specification (CSS/motion properties)
- Fast analysis handling (minimum display time decision)
- Slow analysis handling (anxiety mitigation)
- Failure handling UX (error states, retry flow)
- Cancellation UX
- Transition to results (handoff to Phase 5)
- Mobile loading state adaptations
- Backend requirements: what progress events does the frontend need? WebSocket? Polling? SSE?
- Emotional design: making waiting feel purposeful, not frustrating
```

---

### PHASE 5: First Results Reveal ("The Bloom")

```
=== PHASE 5: FIRST RESULTS REVEAL ("THE BLOOM") ===

You are a senior UX designer specializing in data visualization and emotional design. Your task is to design THE most important moment in the entire product: the first time a student sees their essay annotated with colors and insights.

This is make-or-break. If this moment feels overwhelming ("everything is red, I'm a terrible writer"), the student disengages. If it feels illuminating ("oh, I can SEE where the issues are, and look — some parts are really good!"), they lean in and start their improvement journey.

CONTEXT FROM PRIOR PHASES: Reference Phase 4 (Loading State) for the transition into this moment.

DEEP DIVE QUESTIONS TO ANSWER:

1. THE REVEAL CHOREOGRAPHY
   - How do colors appear? All at once? Paragraph by paragraph? Sentence by sentence?
   - Should the reveal be animated or instant?
   - Option A: "The Bloom" — colors fade in from left to right across the essay over 1.5 seconds, like ink spreading
   - Option B: "The Wave" — paragraph by paragraph, each blooming in sequence with 200ms stagger
   - Option C: "The Instant" — everything appears at once, no animation
   - Option D: "The Focus" — only the first critical issue appears first, rest fade in after 2 seconds
   - Which creates excitement without overwhelm?

2. THE EMOTIONAL CALIBRATION
   - Most first drafts will have significant red/amber. This is NORMAL. But students will panic.
   - How do we prevent the "oh no it's all red" reaction?
   - Idea: Start with strengths — show green/teal FIRST (0.5s), THEN amber/red fade in (0.5s later)
   - Idea: A brief header message: "Your essay has strong moments. Let's make everything this good."
   - Idea: The overview panel immediately shows: "3 strengths found, 5 opportunities for improvement"
   - The framing must be "here's what's working, and here's how to make the rest match" — NOT "here's what's wrong"

3. THE OVERVIEW FIRST
   - Before the student dives into individual annotations, should they see an overview?
   - Option A: Panel shows essay overview (phase, score distribution, strengths summary)
   - Option B: No overview — auto-select the first annotation, show its detail immediately
   - Option C: A brief overlay/modal: "We found 3 critical issues, 5 improvements, and 8 strengths. [Start reviewing →]"
   - The overview should answer: "How is my essay doing?" before "What exactly should I fix?"

4. COLOR DENSITY MANAGEMENT
   - If 70% of sentences are annotated, the essay looks like a Christmas tree. That's overwhelming.
   - How do we manage visual density on first reveal?
   - Default filter: only show critical (red) and needs-work (amber) and strengths (green+)?
   - Or: show all colors but with varying opacity — critical at full opacity, functional near-invisible
   - The FUNCTIONAL tier (sage, 55-75) should be nearly invisible — it's "fine, don't distract"

5. WHAT THEY SEE vs WHAT EXISTS
   - Full analysis produces data for every sentence. But showing ALL of it at once is overwhelming.
   - Progressive revelation: first reveal shows only the most important annotations
   - "Show more" or "Show all" option for students who want full density
   - The improvement phase should drive initial density:
     * Foundation: show only essay-level observations (structural role labels in gutter)
     * Architecture: show paragraph-level indicators
     * Craft+: show sentence-level annotations

6. THE FIRST AUTO-SELECTION
   - After the reveal, should we auto-select the most important annotation?
   - If yes: which one? The highest-priority critical issue? The strongest strength?
   - Starting with a STRENGTH might be emotionally better — "Here's something you did well"
   - Then "Next" takes them to the first issue — by then they've seen they CAN do well
   - Or: auto-select nothing, let them explore on their own (preserves agency)

7. SOUND DESIGN
   - Should the reveal have any audio? A subtle "completion" chime? Typing sounds stopping and being replaced by a soft tone?
   - Probably not by default — but consider it for the option
   - Haptic feedback on mobile? (Phone vibrates slightly when results appear)

8. THE GUTTER REVEAL
   - Paragraph gutter dots and role labels appear alongside the color reveal
   - These provide structural context: "HOOK", "FULCRUM", "RESOLUTION"
   - Should these appear before, during, or after the sentence colors?
   - Gutter labels give the student a structural frame to interpret the colors through

9. THE PANEL STATE DURING REVEAL
   - What's the detail panel showing while colors bloom across the essay?
   - Option A: Essay overview with summary stats (safe, informative)
   - Option B: Empty with a "Click any sentence to see details →" hint
   - Option C: Auto-populated with the highest-priority annotation
   - The panel should NOT be empty — that wastes 40% of the screen during the most important moment

10. RETURNING USERS' FIRST REVEAL
    - First analysis is special. But what about re-analysis after edits?
    - The "re-reveal" should emphasize CHANGE: what improved, what's new, what regressed
    - "Before/after" visual: red dissolving to green where improvements happened
    - This is different from the first-time bloom — it's a DIFF, not a full reveal

DELIVERABLE: A comprehensive first-reveal specification that includes:
- Reveal choreography (animation sequence, timing, easing)
- Emotional calibration strategy (strengths-first? overview-first? messaging?)
- Color density management rules (what's visible by default)
- Auto-selection policy (first annotation to show)
- Gutter reveal choreography
- Panel state during and after reveal
- Re-analysis reveal (diff-based) specification
- Copy/microcopy for any messages or overlays
- Mobile reveal experience
- Backend requirements: does the frontend need results in any specific order? Can layers stream?
- Emotional journey map: second-by-second, what should they feel during the 2-3 second reveal?
```

---

### PHASE 6: First-Time Orientation

```
=== PHASE 6: FIRST-TIME ORIENTATION ("WHAT AM I LOOKING AT?") ===

You are a senior UX designer specializing in onboarding and learnability. Your task is to design how a student LEARNS the annotation system — understanding what colors mean, how to interact with annotations, and how to use the tools — without a tutorial wall.

The best onboarding is invisible: the student figures it out through the UI itself. The worst onboarding is a 5-step tutorial that they dismiss without reading. Design for the former.

CONTEXT FROM PRIOR PHASES: Reference Phase 5 (First Reveal) for what they're seeing.

DEEP DIVE QUESTIONS TO ANSWER:

1. TEACH THROUGH DOING, NOT TELLING
   - Instead of a legend/tutorial, can we teach the system through the FIRST INTERACTION?
   - Auto-select the most important annotation → panel opens → student reads insight → now they understand the pattern
   - First interaction IS the tutorial: color → click → insight → understanding
   - After they close their first annotation, a subtle tooltip: "Use Tab to jump to the next one"
   - How many interactions until they "get it"? Target: 2-3 clicks.

2. THE COLOR LEGEND (IF ANY)
   - Do we show a color legend? Where? When?
   - Option A: Always visible in the toolbar (small colored dots with labels)
   - Option B: Hoverable tooltip on the toolbar annotation summary bar
   - Option C: No legend — colors are self-evident after 2-3 interactions
   - Option D: Legend appears only on first reveal, fades after 10 seconds
   - Risk of legend: students focus on "how many reds do I have" instead of reading insights

3. PROGRESSIVE HINTS
   - First session: helpful hints appear at key moments
   - "Click any highlighted sentence to see feedback" → appears near the first colored sentence
   - "Use Tab to jump to the next annotation" → appears after they close their first panel
   - "Click the gutter dot for paragraph-level insights" → appears after they've reviewed 3+ sentences
   - Each hint appears ONCE, then never again (stored in localStorage)
   - Hints should be positioned near the relevant UI element, not in a corner

4. THE "AHA MOMENT" TARGET
   - What's the specific moment where the student "gets" the system?
   - Target: within 30 seconds of first reveal, the student should understand:
     1. Colors mean something (red = fix, green = good)
     2. Clicking gives details
     3. Details include WHAT to do and WHY
   - Design the first 30 seconds to ensure this sequence happens

5. KEYBOARD SHORTCUT DISCOVERY
   - Tab/Shift+Tab to navigate, Enter to open panel, Escape to close
   - When and how do students learn these?
   - Show shortcuts in the panel footer? In the toolbar? On first use?
   - "Pro tip: Press Tab to jump to the next issue" — shown once after first panel close

6. PANEL TAB AWARENESS
   - Students need to eventually discover the Profile tab (tab 2)
   - But on first use, the Insights tab is more immediately useful
   - When do we hint at the Profile tab? After they've reviewed 5+ insights?
   - "Want to understand WHY this sentence works? Try the Profile tab →"

7. FILTER DISCOVERY
   - Filters are powerful but not immediately needed
   - When do we surface filter awareness? After they've felt overwhelmed by density?
   - Or after they've reviewed most critical issues: "Focus on just structure? Try the filter →"

8. THE COACHING BAR AWARENESS
   - When do we introduce the coaching bar? After they've reviewed several annotations?
   - "Have a question about this feedback? Ask your coach →"
   - Or is the coaching bar self-evident if it's visible at the bottom?

9. RETURNING USER ONBOARDING
   - Student comes back for a second session. No onboarding needed?
   - What if they haven't used a feature yet (e.g., never clicked the Profile tab)?
   - Gentle re-introduction for unused features: "You haven't explored the Profile tab yet — it shows what each sentence is DOING in your essay"

10. ACCESSIBILITY OF ONBOARDING
    - Screen reader users: how do they learn the annotation system?
    - Keyboard-only users: is Tab navigation discoverable?
    - Color blind users: do they learn the non-color indicators (underline styles, gutter sizes)?

DELIVERABLE: A comprehensive onboarding specification that includes:
- The "teachable moment" sequence (what hints, when, where)
- Color legend design decision (if any) with rationale
- Progressive hint system (content, trigger, positioning, one-time logic)
- "Aha moment" design (the first 30 seconds, step by step)
- Keyboard shortcut discovery plan
- Advanced feature discovery timeline (Profile tab, filters, coaching bar)
- Returning user experience (session 2+)
- Accessibility onboarding
- Copy/microcopy for all hints and tooltips
- Backend requirements: does the frontend need user onboarding state from the backend?
- Metrics: how do we measure if onboarding succeeded? (Time to first click, feature discovery rate)
```

---

### PHASE 7: Sentence Click → Panel Open

```
=== PHASE 7: SENTENCE CLICK → PANEL OPEN EXPERIENCE ===

You are a senior interaction designer specializing in micro-interactions and spatial UI. Your task is to design the exact experience of clicking an annotated sentence and seeing the detail panel respond. This is the CORE interaction — it happens 20-50 times per session.

Every millisecond matters. Every animation curve matters. This interaction must feel instant, natural, and satisfying every single time.

CONTEXT FROM PRIOR PHASES: Reference Phase 5 (First Reveal) for the annotation visual state, Phase 6 (Orientation) for how students learned to click.

DEEP DIVE QUESTIONS TO ANSWER:

1. THE CLICK MOMENT
   - What happens the INSTANT they click?
   - Sentence: selection ring appears (how thick? what color? animated or instant?)
   - Other sentences: do they dim? (Opacity change — how much? 0.5? 0.7? or no dimming?)
   - Cursor: does it change on hover BEFORE click? (pointer? crosshair? default?)
   - Click feedback: subtle scale pulse on the sentence? (1.0 → 1.01 → 1.0, 100ms)

2. THE PANEL RESPONSE
   - Panel already open (different sentence selected): content crossfades (how long? 150ms? 200ms?)
   - Panel closed → opens: slide in from right (how long? 250ms? duration? easing?)
   - Does the editor shrink to make room for the panel? Or was the panel space already reserved?
   - If panel was hidden: the editor width change should feel smooth, not jarring
   - Panel content appears: all at once or section by section?

3. THE VISUAL CONNECTION
   - How does the student KNOW the panel content relates to their clicked sentence?
   - Option A: A thin line connects the selected sentence to the panel (like a callout)
   - Option B: The panel header shows the sentence text (or first 60 chars)
   - Option C: The selection ring color matches the panel header accent color
   - Option D: Just spatial proximity — the panel is RIGHT THERE, obviously related
   - Which is clearest without cluttering?

4. RAPID CLICKING (Click sentence 1, immediately click sentence 2)
   - What happens if they click sentences rapidly? Each click should cancel the previous transition.
   - No queue of animations — latest click wins
   - Panel content should crossfade, not slide-out-slide-in (too slow for rapid exploration)
   - Maximum latency from click to content visible: 200ms

5. CLICK vs HOVER BOUNDARY
   - Hover: shows tooltip (300ms delay). Click: opens panel.
   - What if they hover, see the tooltip, then click? Tooltip dismisses smoothly → panel opens
   - What if they click without hovering? Panel opens directly, no tooltip flash
   - What if they hover a long time without clicking? Tooltip persists until mouseout

6. SELECTING NON-ANNOTATED TEXT
   - What if they click text that has NO annotation (functional tier, invisible)?
   - Option A: Nothing happens — only annotated sentences are clickable
   - Option B: Panel shows a brief "This sentence is in good shape — no feedback needed" message
   - Option C: Panel shows the Profile tab content (understanding) even if no Insights exist
   - Option B or C gives value for every click — nothing is a dead zone

7. PARAGRAPH GUTTER CLICK
   - Clicking the paragraph gutter dot/label opens paragraph-level detail
   - How does this feel different from a sentence click?
   - Sentence: precise, specific. Paragraph: broader, structural.
   - Panel transition: same slide/crossfade, but panel header changes to show paragraph info

8. DESELECTION
   - How do they deselect? Click outside the editor? Escape key? Click the same sentence again?
   - What happens to the panel on deselection?
   - Option A: Panel closes (slide out)
   - Option B: Panel shows essay overview (always has content)
   - Option C: Panel stays showing last selection (sticky)
   - Which is least disruptive to their workflow?

9. SCROLL COORDINATION
   - If they click a sentence at the bottom of the editor, the panel should show its content — but what if the panel needs to scroll?
   - Panel auto-scrolls to the relevant section for the clicked sentence
   - If the clicked sentence is near the bottom, does the editor scroll to center it?
   - "Keep selected sentence visible" — both in the editor and conceptually in the panel

10. TOUCH INTERACTIONS (Mobile/Tablet)
    - Tap replaces click. But how does hover work? (Long press for tooltip?)
    - Bottom sheet opens on tap instead of side panel
    - Swipe between annotations on the bottom sheet
    - How does selection ring work on touch? (Thicker for finger accuracy?)

DELIVERABLE: A comprehensive interaction specification that includes:
- Click response timeline (millisecond by millisecond: 0ms click → 50ms ring → 100ms dim → 200ms panel)
- Panel transition animations (CSS properties, durations, easing functions)
- Visual connection between sentence and panel
- Rapid click handling
- Hover/click interaction boundaries
- Non-annotated text click behavior
- Paragraph click behavior
- Deselection behavior and panel state
- Scroll coordination rules
- Touch interaction adaptations
- Backend requirements: does clicking require any API call, or is everything client-side from cached profile?
- Performance budget: total time from click to content visible, maximum animation count
```

---

### PHASE 8: Reading & Processing an Insight

```
=== PHASE 8: READING & PROCESSING AN INSIGHT ===

You are a senior content designer and UX writer specializing in educational feedback. Your task is to design HOW the actual insight content is presented in the panel — the information hierarchy, typography, spacing, and reading experience that makes feedback actionable, not overwhelming.

This is where learning happens. The student reads the insight and either understands what to do, or gets confused and gives up. The content design IS the product.

CONTEXT FROM PRIOR PHASES: Reference Phase 7 (Click → Panel) for how they got here.

DEEP DIVE QUESTIONS TO ANSWER:

1. CONTENT HIERARCHY — WHAT DO THEY READ FIRST?
   - Eye tracking order: people scan top-to-bottom, left-to-right
   - Current panel hierarchy: Type badge → Critique → Why it matters → Suggestion
   - Should "why it matters" come BEFORE the critique? (Context before judgment)
   - Or does the critique need to be first so they know what we're talking about?
   - Ideal reading time per insight: 10-15 seconds for the main critique, 20-30 with the "why"

2. INSIGHT TYPE BADGES
   - Growth Opportunity, Strength Highlight, Structural Insight, Teaching Moment — are these the right types?
   - Should badges be colored (matching the tier) or neutral?
   - Icon + text or just text? (Keep it simple for 16-18 year olds)
   - Do we show the tier explicitly? "Score: 42/100" — or is that too grade-like?
   - Alternative: show tier as a colored bar/gradient without a number

3. THE CRITIQUE ITSELF
   - Length: 2-4 sentences. Never a paragraph. Never a bullet list.
   - Voice: direct, specific, evidence-grounded. Quote the student's actual text.
   - Bad: "This sentence could be more specific."
   - Good: "Your phrase 'it was a really important moment' tells the reader about importance but doesn't let them experience it. The AO at their 30th essay needs to FEEL this moment, not be told about it."
   - How do we ensure the frontend design SUPPORTS this quality? (Enough space, readable font, no truncation)

4. THE "WHY IT MATTERS" SECTION
   - This connects the issue to the essay's architecture (North Star)
   - Always present? Or collapsible/expandable?
   - Format: one sentence connecting to structural significance
   - "This is your fulcrum paragraph — everything after this moment depends on the reader having FELT this scene."
   - Should it reference the North Star explicitly? Or keep it conversational?

5. STRENGTHS DISPLAY (EVEN ON PROBLEM SENTENCES)
   - Every sentence, even critical ones, might have something working
   - "What's working: your voice is authentic here — don't lose that in revision"
   - Position: AFTER the critique? BEFORE? In a separate collapsible section?
   - This prevents the feeling of "everything about this sentence is wrong"

6. READABILITY & TYPOGRAPHY
   - Font size in the panel: 14px? 15px? (Readable but fits enough content)
   - Line height: 1.5? 1.6? (Comfortable reading)
   - Max width: should the text have a max line length for readability? (65-75 characters ideal)
   - Contrast: sufficient for reading on glass morphism background
   - Sections separated by: spacing? Dividers? Different background?

7. SCROLLING WITHIN THE PANEL
   - If an insight has long content (critique + why + suggestion + strengths), the panel scrolls
   - How does in-panel scrolling interact with editor scrolling?
   - Should the panel have section anchors? (Jump to "Why it matters", jump to "Suggestion")
   - Does the panel show a scroll indicator? ("More below ↓")

8. MULTIPLE ANNOTATIONS PER SENTENCE
   - L5 can produce 2-3 annotations for the same sentence range
   - How do we show multiple insights? Stacked cards? Tabbed within the Insights tab?
   - Priority: show the highest-priority insight first, with "2 more insights" collapsed
   - Or: show all insights in a scrollable list within the tab

9. LINKING AND CROSS-REFERENCING
   - An insight might reference another part of the essay: "P4 needs the reader to have experienced P1"
   - Should "P4" and "P1" be clickable links that jump to those paragraphs?
   - This creates a non-linear reading experience — the student can trace connections
   - But it also might distract them from the current insight. Opt-in links? Footnote-style?

10. THE "I UNDERSTAND" MOMENT
    - At what point has the student processed the insight and is ready to act?
    - Should there be an explicit "Got it" or "Mark as reviewed" action?
    - Or is the act of clicking the next annotation the implicit "I'm done with this one"?
    - Tracking: do we track which insights they've viewed? (For progress display)

DELIVERABLE: A comprehensive insight content design specification that includes:
- Content hierarchy (what appears in what order, with rationale)
- Typography specification (sizes, weights, colors, spacing)
- Type badge design (visual, copy)
- Critique content structure (template with placeholders showing ideal format)
- "Why it matters" section design
- Strengths section design (on problem sentences)
- Multiple annotations handling
- Cross-reference design (clickable paragraph/sentence links)
- Scrolling behavior within the panel
- "Viewed/reviewed" tracking design
- Example content: write 3 full example insights (one critical, one needs-work, one strength) showing exactly how they'd appear in the panel
- Backend requirements: what format does L5 need to output for optimal frontend display?
- Emotional design: how does reading feedback FEEL? Supportive? Honest? Actionable?
```

---

### PHASE 9: Rewrite Suggestion Experience

```
=== PHASE 9: THE REWRITE SUGGESTION EXPERIENCE ===

You are a senior UX designer and content strategist. Your task is to design how rewrite suggestions (concrete examples of improved text) are presented and interacted with. This is one of the most delicate features — the line between "helpful example" and "AI writing the essay for them" is thin.

Admissions officers WILL notice if essays contain AI-generated sentences. The rewrite must be framed as INSPIRATION, not replacement.

CONTEXT FROM PRIOR PHASES: Reference Phase 8 (Reading Insights) for where the rewrite appears within the panel.

DEEP DIVE QUESTIONS TO ANSWER:

1. FRAMING: INSPIRATION vs REPLACEMENT
   - "Here's one way to approach this" — not "Here's what you should write"
   - The rewrite should be obviously different from the student's voice (by design?)
   - Or should it attempt to match their voice? (Better output but more "paste-able")
   - Label: "Example approach" / "One possibility" / "Try something like" — which framing works?
   - Explicitly state: "Don't copy this — use it to spark your own revision"

2. VISUAL DESIGN OF THE REWRITE
   - How is the rewrite visually differentiated from the critique?
   - Option A: Collapsible card with a different background (slightly tinted)
   - Option B: Indented block quote with a left border
   - Option C: Hidden by default behind a "See example →" toggle
   - Option D: Always visible but visually secondary (smaller font, muted color)
   - The rewrite should look like a reference tool, not the main content

3. THE "APPLY" INTERACTION
   - Should there be an "Apply to Essay" button? (Dangerous — one-click AI insertion)
   - Alternative: "Copy to clipboard" — they manually paste and then modify
   - Alternative: "Use as starting point" — replaces the sentence in the editor but puts cursor there for editing
   - Alternative: No apply at all — they read it, close the panel, and rewrite in their own words
   - Which approach best prevents AI-paste while still being useful?

4. EDITABLE SUGGESTIONS
   - Can the student modify the suggestion BEFORE applying it?
   - Inline editing within the suggestion box — they can tweak it to match their voice
   - This is better than raw paste: they're forced to engage with the text
   - But is it too complex? Does a mini-editor within the suggestion confuse the interaction model?

5. MULTIPLE SUGGESTIONS
   - Should we offer more than one rewrite option?
   - "Option A: sensory approach" / "Option B: dialogue approach" / "Option C: reflective approach"
   - Multiple options show the student that there's not ONE right answer — there are creative choices
   - But multiple options add visual complexity. Maybe 2 max, expandable.

6. WHEN TO SHOW vs HIDE
   - Not every insight needs a rewrite suggestion. When do we include one?
   - Critical/needs-work: almost always (actionable)
   - Strength: rarely (it's already good — maybe a subtle refinement?)
   - Structural: sometimes (depends on whether it's a sentence-level issue)
   - The L5 prompt controls this — but the frontend needs to handle presence/absence gracefully

7. VOICE CONSISTENCY
   - The rewrite should attempt to match the student's voice (per the voice profile)
   - But it should also demonstrate IMPROVEMENT — which might mean a different approach
   - Tension: "match my voice" vs "show me something better"
   - Resolution: the rewrite should match their register/vocabulary but improve specificity/structure

8. THE "COMPARE" VIEW
   - Side-by-side: student's original sentence vs suggested rewrite
   - Diff highlighting: show what changed (additions in green, removals in red)
   - This makes the learning visible: "Oh, they replaced 'really important' with a concrete detail"
   - Is a diff view too technical for 16-18 year olds? Or is it illuminating?

9. TRACKING APPLIED SUGGESTIONS
   - If a student applies a suggestion, should the system remember?
   - "This sentence was revised from a suggestion" — meta-information for re-analysis
   - Should the system flag if too many sentences are suggestion-derived? (AI detection risk)
   - This is more of a backend concern, but the frontend might show a subtle indicator

10. MOBILE REWRITE EXPERIENCE
    - On mobile, the rewrite appears in the bottom sheet — space is limited
    - Long rewrites might dominate the sheet. How do we handle length?
    - "Apply" interaction on mobile: copy + navigate back to editor?

DELIVERABLE: A comprehensive rewrite suggestion specification that includes:
- Framing strategy (copy, positioning, disclaimers)
- Visual design (layout, colors, typography, collapsibility)
- "Apply" interaction design (if any) with full rationale
- Editable suggestion UX (if any)
- Multiple suggestion handling
- Show/hide rules (when do rewrites appear)
- Compare/diff view design (if any)
- Tracking and AI detection considerations
- Mobile adaptations
- Example content: write 2 full rewrite suggestions showing the visual format and framing
- Backend requirements: what does L5 need to produce for optimal rewrite presentation?
- Ethical considerations: how do we prevent AI essay generation while still being useful?
```

---

### PHASE 10-27: Remaining Phase Prompts

Due to the size of this document, I'll provide the remaining phase prompts in a condensed but equally rigorous format. Each follows the same structure: role, context, 10 deep-dive questions, and deliverable specification.

---

### PHASE 10: Navigation Between Annotations

```
=== PHASE 10: NAVIGATING BETWEEN ANNOTATIONS ===

Role: Senior interaction designer specializing in navigation patterns and information architecture.

Task: Design how students move from one annotation to the next — the flow between insights that makes reviewing feedback feel like a guided journey, not a scavenger hunt.

Context: Reference Phases 7-9 for the single-annotation experience.

DEEP DIVE QUESTIONS:

1. NAVIGATION ORDER
   - Document order (top to bottom) vs priority order (most critical first) vs smart order (what the system recommends)
   - Priority order: critical → needs-work → strengths — but this jumps around the essay physically
   - Document order: linear, predictable, but they might hit 5 "functional" sentences before a critical one
   - Smart order: system-recommended path that hits high-priority issues in roughly document order
   - Can the student switch between ordering modes? Or is one default enough?

2. THE "NEXT" MECHANISM
   - Tab key: keyboard-forward, fast, but requires keyboard learning
   - "Next →" button in the panel: visible, discoverable, clickable
   - Arrow navigation: ↑/↓ for prev/next in the panel
   - Auto-advance: after X seconds viewing one insight, gently pulse the "Next" button
   - Combine all: Tab works, button visible, both do the same thing

3. PROGRESS INDICATOR
   - "Viewing 3 of 12 annotations" — shows position in the review queue
   - Progress bar in the panel header: subtle, informative
   - Does progress motivate ("almost done!") or overwhelm ("12 more to go...")?
   - Show count by tier: "3 critical remaining, 5 improvements remaining"

4. SKIP & FILTER DURING NAVIGATION
   - Can they skip an annotation? "Skip → Next"
   - Can they filter WHILE navigating? "Show only critical" then Tab through just reds
   - If filters are active, does Tab respect the filter? (Yes — Tab skips non-visible annotations)

5. THE JUMP-BACK PATTERN
   - They're reviewing sentence 15, but the insight references sentence 3
   - They click "P1S3" in the connections section — jump to sentence 3
   - Now: "← Back to P3S5" breadcrumb should appear at the top of the panel
   - Navigation stack: push/pop for back-forward, max depth 5
   - How deep can the navigation stack go before it's confusing?

6. VISUAL TRAIL
   - Which annotations have they already viewed? Visual indicator on the sentence?
   - Viewed: slightly muted annotation color? A small checkmark on the gutter dot?
   - This gives them a sense of progress and helps them find unreviewed annotations

7. PARAGRAPH GROUPING
   - When navigating, do they navigate sentence-by-sentence or paragraph-by-paragraph?
   - If a paragraph has 3 annotations, do they step through each, or see them grouped?
   - "Paragraph 2: 3 annotations" — tap to expand into individual sentence navigation

8. END OF REVIEW
   - They've viewed all annotations. What now?
   - "You've reviewed all feedback. Ready to start editing?" CTA
   - Show essay overview with summary of what they learned
   - Or: loop back to the first critical annotation (focus on action)

9. MOBILE NAVIGATION
   - Swipe left/right on bottom sheet to navigate between annotations
   - "3/12" indicator at the top of the sheet
   - Bottom navigation bar: [← Prev] [3/12] [Next →]

10. SMART RE-ORDERING AFTER EDITS
    - After they edit and re-analyze, the annotation order might change
    - New annotations (from re-analysis) should appear first in the navigation queue
    - "New" badge on fresh annotations — "This is new feedback based on your recent edits"

DELIVERABLE: Navigation specification including: ordering algorithm, Tab/button behavior, progress display, skip/filter interaction, jump-back stack, viewed/unviewed indicators, paragraph grouping, end-of-review experience, mobile adaptation, and backend requirements.
```

---

### PHASE 11: Annotation List / Map View

```
=== PHASE 11: THE ANNOTATION LIST / MAP VIEW ===

Role: Senior UX designer specializing in information dashboards and overview patterns.

Task: Design the "bird's eye" view of ALL annotations — a scannable list or map that gives students a complete picture of their feedback without clicking through one by one.

Context: Reference Phases 7-10 for the individual annotation experience.

DEEP DIVE QUESTIONS:

1. WHEN DO THEY WANT THIS VIEW?
   - After first reveal: "Let me see everything before diving in"
   - Mid-review: "How much is left? What areas need the most work?"
   - After editing: "What changed? What's still open?"
   - Is this the default "no selection" state of the panel? Or a separate mode?

2. LIST vs MAP vs HEATMAP
   - List: Scrollable list of all annotations, grouped by paragraph, showing type + first line of critique
   - Map: Minimap of the essay (like VS Code's minimap) with colored regions
   - Heatmap: The essay text with color intensity showing annotation density
   - Which is most useful for essay-length documents (25-40 sentences)?

3. GROUPING & SORTING
   - Group by: paragraph (default) / tier (critical first) / type (growth vs strength)
   - Sort within groups: priority / document order / newest first (after re-analysis)
   - Quick filters: "Critical only" / "Unreviewed" / "Strengths"

4. LIST ITEM DESIGN
   - Each item shows: tier dot + location (P2S3) + first line of critique (truncated)
   - Clicking a list item: jumps to that sentence in the editor AND opens its detail panel
   - Hover on list item: highlights the corresponding sentence in the editor
   - Viewed indicator: subtle visual difference for reviewed vs unreviewed items

5. SUMMARY STATISTICS
   - At the top of the list view: score distribution chart (mini histogram or pie)
   - "5 critical, 8 needs improvement, 12 functional, 10 strong, 3 exceptional"
   - Average effectiveness score? Or is that too grade-like?
   - "Your essay's strongest area: voice consistency. Weakest: opening specificity."

6. THE MINIMAP CONCEPT
   - A tiny version of the entire essay, scrollable, with colored blocks for each sentence
   - Clicking a block in the minimap jumps to that sentence
   - Is this useful or gimmicky for 5-paragraph essays? (Might be more useful for longer texts)

7. PROGRESS TRACKING
   - After they've reviewed some annotations and made edits:
   - "7/12 annotations reviewed, 3 issues resolved, 2 pending re-analysis"
   - Visual: progress bar or checklist

8. ACTIONABLE SUMMARY
   - At the bottom: "Start with: P2S3 — your highest-priority improvement" → clickable CTA
   - Or: "Recommended editing order: P2S3 → P1S1 → P4S2" → clickable sequence
   - This turns the overview into a launch pad for action

9. RELATIONSHIP TO ESSAY OVERVIEW
   - How does the annotation list relate to the essay-level overview (Phase 19)?
   - Are they the same panel? Or different views/tabs?
   - Overview = high-level (phase, through-line, readiness). List = annotation-specific.

10. MOBILE LIST VIEW
    - On mobile, the list might be the primary navigation (instead of clicking through the essay)
    - Swipeable cards? Scrollable list? Grouped accordion?

DELIVERABLE: Annotation list/map specification including: view type decision, grouping/sorting, list item design, summary stats, minimap design (if any), progress tracking, actionable CTA, relationship to overview, mobile design, and backend requirements.
```

---

### PHASE 12: Making the First Edit (In-Place)

```
=== PHASE 12: MAKING THE FIRST EDIT (IN-PLACE) ===

Role: Senior interaction designer specializing in editing workflows and dual-mode interfaces.

Task: Design the experience of transitioning from READING feedback to EDITING text — in the same interface, at the same time. This is where the value proposition delivers: read the insight, edit the text, see the improvement.

Context: Reference Phases 7-9 for the feedback reading experience.

DEEP DIVE QUESTIONS:

1. THE READ→EDIT TRANSITION
   - Student is reading an insight in the panel. They want to edit the sentence. What's the transition?
   - Do they click into the sentence text in the editor and just start typing?
   - Does the annotation decoration (color, underline) persist while they're typing IN that sentence?
   - Or does it gracefully fade during editing and return when they stop?
   - Should there be a visual "edit mode" indicator? Or is editing always available?

2. PANEL BEHAVIOR DURING EDITING
   - Panel stays open while they type? (Reference material while editing — valuable)
   - Panel hides to give more editor space? (More room for writing — but loses the insight)
   - Panel stays but the content dims slightly? (Present but not competing for attention)
   - Can they snap the panel to a floating position? Drag it over the editor?

3. ANNOTATION STATE DURING EDITING
   - While they're actively typing in a sentence, the annotation for THAT sentence should:
   - Option A: Remain visible (so they can see the color while editing)
   - Option B: Fade to a neutral state (editing in progress — annotation may be stale)
   - Option C: Remain but with a subtle "editing" indicator (pulsing border?)
   - OTHER sentences' annotations remain unchanged during local editing

4. THE REWRITE FLOW
   - Student reads insight → sees rewrite suggestion → wants to try something similar
   - Do they: look at the suggestion, close/minimize the panel, type their version?
   - Or: keep the panel open with the suggestion visible while typing in the editor?
   - Or: copy the suggestion, paste it, then modify it? (Apply → Edit flow)
   - Design for all three patterns — different students will prefer different approaches

5. CURSOR & FOCUS MANAGEMENT
   - Click insight panel → read feedback → want to edit → need to click into the editor
   - That's two clicks (one to read, one to start editing). Can we reduce to one?
   - "Edit this sentence" button in the panel that places the cursor at the right position?
   - Or is clicking into the editor text natural enough?

6. UNDO/REDO WITH ANNOTATIONS
   - Student edits a sentence. Ctrl+Z undoes the edit. Do the annotations revert too?
   - Annotations are computed, not stored in the editor — Ctrl+Z affects text only
   - This means undo restores text but annotations are still stale until re-analysis
   - Is this confusing? "I undid my edit but the annotation didn't come back"

7. MULTI-SENTENCE EDITING
   - Sometimes the fix involves rewriting 2-3 sentences together (paragraph-level revision)
   - How does the annotation system handle editing across sentence boundaries?
   - Merging two sentences: the annotation mapping breaks (sentence count changed)
   - Splitting a sentence: same problem
   - These structural edits should mark the entire paragraph as stale

8. PARAGRAPH RESTRUCTURING
   - Student adds a new paragraph (Enter at the end of a paragraph)
   - Student deletes a paragraph entirely
   - Student reorders paragraphs (cut + paste)
   - All of these break positional annotations — how does the UI handle it?
   - "Structural change detected — annotations will be updated after re-analysis"

9. WORD COUNT DURING EDITING
   - Common App has a 650-word limit. Student is at 640 and editing.
   - Word count indicator should be VERY visible during editing (can't go over)
   - Color change: green (safe) → amber (within 20 words) → red (over limit)
   - If over limit: which sentences can they cut? Can annotations help identify expendable text?

10. THE "DRAFT VS ANALYZED" AWARENESS
    - While editing, the text in the editor diverges from the last-analyzed text
    - How do we communicate "you've changed this since analysis"?
    - Stale indicator on the sentence? A global "edits pending re-analysis" banner?
    - This sets up Phase 13 (Stale State)

DELIVERABLE: Edit-in-place specification including: read→edit transition, panel behavior during editing, annotation state during editing, rewrite flow, cursor management, undo/redo behavior, multi-sentence editing, structural edits, word count during editing, draft-vs-analyzed awareness, and backend requirements.
```

---

### PHASE 13: Stale State & Re-analysis Decision

```
=== PHASE 13: STALE STATE & THE DECISION TO RE-ANALYZE ===

Role: Senior UX designer specializing in state management visualization and decision interfaces.

Task: Design how the UI communicates that annotations are STALE (the text has changed since analysis) and how the student decides when to re-analyze. This is the bridge between editing and the iteration loop.

Context: Reference Phase 12 (Editing) for how edits happen.

DEEP DIVE QUESTIONS:

1. WHAT IS "STALE"?
   - Student changes one word → that sentence's annotation is stale
   - Student rewrites a paragraph → entire paragraph is stale
   - Student adds a paragraph → surrounding paragraphs might be stale (structural change)
   - Levels of staleness: sentence-level (mild) vs paragraph-level (moderate) vs structural (severe)
   - How granular does the stale indicator need to be?

2. VISUAL STALE STATE
   - The annotation color should change to indicate staleness. How?
   - Option A: Desaturate (red becomes gray-red, green becomes gray-green)
   - Option B: Diagonal hatch overlay (like a "pending" pattern)
   - Option C: Dotted border instead of solid (uncertain state)
   - Option D: Annotation entirely removed (clean text until re-analyzed)
   - The stale state should say "this was relevant but may have changed" — not "this is wrong"

3. THE RE-ANALYSIS TRIGGER
   - When should re-analysis be offered? After every edit? After a pause? Manual only?
   - Option A: "Re-analyze" button in toolbar, always available, pulses gently after edits
   - Option B: Inline prompt on stale sentences: "This has changed — [Re-analyze]"
   - Option C: After 5+ seconds of no typing, a gentle banner: "Ready to see updated feedback?"
   - Option D: Auto re-analysis (focused mode, 2-3 seconds) on pause — no button needed
   - Cost consideration: focused re-analysis is cheap ($0.02-0.10), so auto is viable

4. FOCUSED vs COMPREHENSIVE
   - Focused: re-analyzes only changed paragraphs (~2-5 seconds, ~$0.02-0.10)
   - Comprehensive: full L1-L5 re-run (~8-20 seconds, ~$0.15-0.50)
   - When does the system choose which? Student choice? Auto-detection?
   - Small edit (one sentence changed): always focused
   - Structural edit (paragraph added/removed): always comprehensive
   - Gray area: 3-4 sentences across 2 paragraphs — focused or comprehensive?
   - Should the student see this choice? Or should the system just pick the right one?

5. EDITING DURING RE-ANALYSIS
   - They triggered re-analysis but keep editing. Now what?
   - Their new edits happen AFTER the snapshot — new staleness on top of in-progress analysis
   - Show: "Analysis in progress — your additional edits will need another round"
   - Or: debounce — wait for them to stop editing, THEN trigger analysis

6. THE STALE COUNT
   - "3 sentences edited since last analysis" — shown in toolbar? In the gutter?
   - This motivates re-analysis: "I've made enough changes, let me see the impact"
   - Or does counting feel like pressure? "I need to fix 3 more things before analyzing"

7. STALE + STRENGTH INTERACTION
   - A sentence was green (strong). Student edits it. Now it's stale.
   - Does the student feel anxious? "I might have broken a good sentence"
   - The stale state should not feel punitive — it should feel neutral ("updated, pending review")
   - Maybe green stale looks different from red stale (green keeps a hint of green?)

8. BATCH EDITING THEN RE-ANALYZING
   - Some students will edit 5-10 things before re-analyzing (batch approach)
   - Others will edit one thing and re-analyze immediately (incremental approach)
   - The UI should support BOTH styles without bias
   - Batch: the stale state accumulates naturally, re-analyze button shows count
   - Incremental: re-analysis is quick enough that the loop feels fast

9. MOBILE STALE STATE
   - On mobile, stale indicators need to be visible but not overwhelming
   - Simplified stale state: paragraph-level only (not sentence-level)
   - "3 paragraphs edited" badge on the toolbar

10. THE DECISION MOMENT
    - The emotional psychology of re-analyzing: "Am I ready to be judged again?"
    - Frame it as: "See your progress" not "Get re-evaluated"
    - CTA: "See updated feedback" / "Check your improvements" / "Update analysis"
    - The button copy should make them WANT to press it (curiosity, not anxiety)

DELIVERABLE: Stale state specification including: staleness levels, visual treatment per level, re-analysis trigger mechanism, focused vs comprehensive decision logic, editing-during-re-analysis handling, batch vs incremental support, stale count display, emotional framing, mobile adaptation, and backend requirements (diff computation, analysis mode selection API).
```

---

### PHASES 14-27: Condensed Prompts

For space efficiency, here are the remaining prompts in a condensed format. Each maintains the same depth of questioning — just presented more concisely.

---

### PHASE 14: The Red→Green Moment

```
=== PHASE 14: THE RED→GREEN MOMENT (IMPROVEMENT FEEDBACK) ===

Role: Emotional design specialist and game UX designer.

Task: Design the most satisfying moment in the product — when a student's edit improves a sentence and the annotation changes color (e.g., red→green). This is the dopamine hit that makes the iteration loop addictive.

Key Questions:
1. Color transition animation: what does red dissolving into green look like? Duration? Easing? Particle effects?
2. Partial improvement (red→yellow): how does "better but not great" feel? Still satisfying?
3. Score change animation: does the effectiveness score counter animate upward?
4. Gutter dot color shift: synchronized with sentence color change?
5. Summary bar update: annotation counts change (one fewer red, one more green) — animate the count badges?
6. Sound design: optional chime? Haptic on mobile?
7. The reverse (green→red after a bad edit): how does regression feel? Warning without punishment?
8. Multiple improvements at once (after batch editing): cascading celebrations? Or one combined?
9. Progress celebration milestones: "All critical issues resolved!" / "Your essay moved to Craft phase!"
10. The psychology of visible progress: how does this motivate continued editing?

Deliverable: Improvement feedback animation spec, regression handling, celebration design, milestone triggers, emotional design rationale, mobile adaptations, and backend requirements (how does the frontend detect improvement from re-analysis results?).
```

---

### PHASE 15: Iteration Loop Pacing

```
=== PHASE 15: THE ITERATION LOOP PACING ===

Role: UX strategist specializing in workflow optimization and flow state design.

Task: Design the cadence and rhythm of the core loop: read feedback → edit → re-analyze → see improvement → next issue. The pacing determines whether this feels like productive flow or tedious stop-and-start.

Key Questions:
1. Optimal loop speed: what's the ideal time for one full cycle? (Target: <30 seconds for focused re-analysis)
2. Batch vs incremental editing: do we guide them toward one pattern or support both equally?
3. Session duration: how long should a productive editing session be? (30 min? 60 min? What triggers "take a break"?)
4. Decision fatigue: after 10+ annotation reviews, do they get tired? How do we detect and mitigate?
5. The "good enough" trap: student fixes easy issues (word choice) but avoids hard ones (structure). How do we nudge toward structural work?
6. Re-analysis wait integration: during the 2-5 second focused analysis, what do they do? Read the next insight preview?
7. Context switching cost: reading (panel) → writing (editor) → reading (panel) — can we reduce the cognitive switch?
8. The recommended sequence: should the system suggest an editing order? "Fix P2S3 first — it affects 3 other sentences"
9. Progress dashboarding during iteration: mini progress bar showing how many issues resolved?
10. When to stop iterating: at what point does the system say "diminishing returns — your essay is strong"?

Deliverable: Iteration loop design spec, pacing targets, batch/incremental strategy, session management, fatigue mitigation, recommended sequence logic, progress display, stopping criteria, and backend requirements.
```

---

### PHASE 16-27: Remaining Prompts (Same Depth)

Each of these follows the identical structure. I'll list titles, role, and key unique questions for each.

---

**PHASE 16: Profile Tab Deep Dive** — Role: Information architecture specialist. Key: When does the Profile tab add value? How to present observedFunctions, inferredIntents, craft details? How to differentiate understanding from analysis? When to recommend this tab vs Insights?

**PHASE 17: Connection Discovery** — Role: Data visualization designer. Key: How do connection lines render without crossing text? When do connections appear (only on click)? How does "jump to connected sentence" work with back-navigation? Connection type icons/colors? Can connections become overwhelming?

**PHASE 18: Paragraph-Level Zoom** — Role: Multi-resolution interface designer. Key: How does clicking the gutter change the panel? What paragraph-level data is shown (structural role, aggregate scores, sentence breakdown)? How does paragraph view relate to sentence view? Zoom metaphor (paragraph = context, sentence = detail)?

**PHASE 19: Essay-Level Overview & Progress** — Role: Dashboard designer. Key: What's the default "no selection" panel content? Phase indicator, readiness bars, through-line display, score distribution. How to show progress over time (session-over-session improvement)? When to show the overview vs annotation details?

**PHASE 20: Phase Transitions** — Role: Game progression designer. Key: How does the UI communicate "your essay improved to Architecture phase"? Visual celebration? New features unlocking (word-level highlights)? What disappears (essay-level annotations no longer needed)? How to prevent confusion ("where did my annotations go?")?

**PHASE 21: Filter & Focus Modes** — Role: Search/filter UX designer. Key: What filters are available? Preset modes ("Issues Only", "Strengths Only")? Per-tier toggles? Per-dimension filters ("just voice issues")? How do filters affect the annotation count display? Keyboard shortcut for toggle? Remembering filter state across sessions?

**PHASE 22: Strength vs Problem Balance** — Role: Motivational UX designer. Key: What ratio of positive to negative feedback? (3:1? 2:1?) When to lead with strengths vs problems? How to prevent "all red" feeling on weak essays? How to prevent complacency on strong essays? Celebration of strengths after improvement? The tone of positive feedback (genuine vs patronizing)?

**PHASE 23: Coaching Bar Integration** — Role: Conversational UI designer. Key: When does the coaching bar appear? How does it relate to the annotation panel? Context-aware questions based on selected sentence? Multi-turn conversation display? How does coaching reference annotations? When does coaching add value that annotations don't?

**PHASE 24: Contextual Smart Prompts** — Role: Content strategy and NLP designer. Key: What questions to suggest based on current selection? Format: buttons vs placeholder text vs carousel? How many prompts at a time (3 max)? Do prompts change when selection changes? Example prompts for each improvement phase?

**PHASE 25: Return Visit & Re-entry** — Role: Retention and continuity designer. Key: What does session 2 look like? Welcome back summary? Diff since last analysis? Stale annotations from last session? Remembering scroll position? Remembering last-viewed annotation? "Pick up where you left off" vs "here's what's new"?

**PHASE 26: Near-Completion Polish** — Role: Endgame experience designer. Key: How does the UI feel when 90%+ is green? Reduced annotation density? Shifted focus to memorability/distinction? "Your essay is almost there" messaging? The last few amber issues — how to make them feel achievable, not nitpicky?

**PHASE 27: The "Ready" Signal** — Role: Product strategist and legal-aware designer. Key: What threshold means "ready"? How to communicate readiness without making admissions promises? "Our system has no further suggestions" vs "This essay is ready to submit"? Visual signal: badge? Celebration? Score? Phase indicator at "Distinction"? What about students who are never satisfied — how to help them stop iterating?

---

## How to Run Each Phase

For each phase chat:

1. Paste the **SHARED CONTEXT BLOCK** (above)
2. Paste the **PHASE-SPECIFIC PROMPT**
3. If running a later wave, paste the **DELIVERABLES from prior phases** as additional context:
   ```
   === PRIOR PHASE DELIVERABLES ===
   [Paste the deliverable summaries from completed phases here]
   === END PRIOR DELIVERABLES ===
   ```
4. Run the chat. The output should be a comprehensive UX specification document.
5. Save the deliverable for use in subsequent phases.

After all 27 phases are complete, run a **SYNTHESIS CHAT** that receives all 27 deliverables and produces the unified UX specification with:
- Cross-phase consistency audit
- Transition flow diagrams
- Complete component inventory
- Animation timeline (all animations, durations, triggers)
- Copy document (all microcopy, labels, messages)
- Backend requirements matrix (all API needs consolidated)
- Emotional journey map (full lifecycle from empty page to submission-ready)
